import { chmodSync, mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { runCli, validateCliPath, verifyCli } from './cliClient'

const dir = mkdtempSync(join(tmpdir(), 'chakra-'))
/** Stub CLI: a node script. Behavior chosen by the first line of the test's script body. */
const stub = (name: string, body: string): string => {
  const p = join(dir, name)
  writeFileSync(p, `#!/usr/bin/env node\nconst a=process.argv.slice(2);let i='';process.stdin.on('data',d=>i+=d);process.stdin.on('end',()=>{${body}})\n`)
  chmodSync(p, 0o755)
  return p
}
const ok = (data: string): string => `console.log(JSON.stringify({ok:true,data:${data},apiVersion:1}))`

describe('runCli', () => {
  it('passes group/command in argv and the payload only on stdin', async () => {
    const p = stub('echo', ok('{argv:a,stdin:i}'))
    const r = await runCli(p, 'auth', 'login', { email: 'a@b.c', password: 'hunter2' })
    expect(r.ok && r.data).toEqual({ argv: ['auth', 'login'], stdin: '{"email":"a@b.c","password":"hunter2"}' })
    expect(JSON.stringify((r as any).data.argv)).not.toContain('hunter2')
  })
  it('does not use a shell', async () => {
    const p = stub('noshell', ok('a'))
    const r = await runCli(p, 'a; echo hi', 'x')
    expect(r.ok && (r.data as string[])[0]).toBe('a; echo hi')
  })
  it('maps bad JSON, spawn failure, timeout and oversized output', async () => {
    expect((await runCli(stub('bad', 'console.log("nope")'), 'a', 'b') as any).error.code).toBe('internal')
    expect((await runCli(join(dir, 'missing'), 'a', 'b') as any).error.code).toBe('cli_unavailable')
    expect((await runCli(stub('hang', 'setTimeout(()=>{},5000)'), 'a', 'b', {}, 150) as any).error.code).toBe('cli_timeout')
    expect((await runCli(stub('big', 'console.log("x".repeat(6000000))'), 'a', 'b') as any).error.code).toBe('internal')
  })
  it('rejects an envelope without the required shape', async () => {
    expect((await runCli(stub('shape', 'console.log(JSON.stringify({ok:false}))'), 'a', 'b') as any).error.code).toBe('internal')
  })
})

describe('validateCliPath / verifyCli', () => {
  it('rejects missing files and directories', () => {
    expect(validateCliPath(join(dir, 'nope'))).toBeTruthy()
    expect(validateCliPath(dir)).toBeTruthy()
  })
  it('accepts a compatible CLI and reports doctor results', async () => {
    const p = stub('good', `console.log(JSON.stringify(a[1]==='version'?{ok:true,data:{version:'1.2.3',apiVersion:1}}:{ok:true,data:{checks:[{id:'sqlite',ok:true,message:'x'},{id:'email',ok:false,message:'y'}]}}))`)
    const r = await verifyCli(p)
    expect(r.ok && r.data).toMatchObject({ version: '1.2.3', apiVersion: 1, healthy: false })
  })
  it('rejects an incompatible apiVersion', async () => {
    const p = stub('old', `console.log(JSON.stringify({ok:true,data:{version:'9',apiVersion:2}}))`)
    expect((await verifyCli(p) as any).error.code).toBe('cli_incompatible')
  })
})
