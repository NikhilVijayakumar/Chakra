import { chmodSync, mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { IPC, LONG_OPS } from '../shared/contract'
import { registerChakra } from './register'

const setup = () => {
  const dir = mkdtempSync(join(tmpdir(), 'chakra-reg-'))
  const cli = join(dir, 'cli')
  writeFileSync(cli, `#!/usr/bin/env node\nlet i='';process.stdin.on('data',d=>i+=d);process.stdin.on('end',()=>{const a=process.argv.slice(2);if(a[1]==='version')console.log(JSON.stringify({ok:true,data:{version:'1',apiVersion:2}}));else if(a[1]==='doctor')console.log(JSON.stringify({ok:true,data:{checks:[]}}));else console.log(JSON.stringify({ok:true,data:{argv:a,body:JSON.parse(i||'{}')}}))})\n`)
  chmodSync(cli, 0o755)
  const h: Record<string, (e: unknown, ...a: any[]) => any> = {}
  registerChakra({ appId: 'my-app', configDir: dir, ipc: { handle: (c, f) => { h[c] = f } } })
  return { h, cli }
}

describe('registerChakra', () => {
  it('has no CLI configured until saved', async () => {
    const { h } = setup()
    expect((await h[IPC.call]({}, { op: 'sync.status' })).error.code).toBe('cli_unavailable')
  })
  it('reports connection status of the saved CLI', async () => {
    const { h, cli } = setup()
    expect((await h[IPC.cliStatus]({})).error.code).toBe('cli_unavailable')
    await h[IPC.cliSave]({}, cli)
    expect((await h[IPC.cliStatus]({})).ok).toBe(true)
  })
  it('saves only after main re-verifies, then proxies calls', async () => {
    const { h, cli } = setup()
    expect((await h[IPC.cliSave]({}, '/does/not/exist')).ok).toBe(false)
    expect((await h[IPC.cliGet]({})).cliPath).toBeNull()
    expect((await h[IPC.cliSave]({}, cli)).ok).toBe(true)
    expect((await h[IPC.cliGet]({})).cliPath).toBe(cli)
    const r = await h[IPC.call]({}, { op: 'auth.login', payload: { email: 'a', password: 'p' } })
    expect(r.data.argv).toEqual(['auth', 'login'])
  })
  it('injects appId for app-scoped ops and ignores one sent by the renderer', async () => {
    const { h, cli } = setup()
    await h[IPC.cliSave]({}, cli)
    const r = await h[IPC.call]({}, { op: 'content.get', payload: { appId: 'evil', content: 'holidays' } })
    expect(r.data.body).toEqual({ appId: 'my-app', content: 'holidays' })
    const login = await h[IPC.call]({}, { op: 'auth.login', payload: { email: 'a' } })
    expect(login.data.body.appId).toBeUndefined()
  })
  it('rejects operations outside the whitelist (including meta.*)', async () => {
    const { h, cli } = setup()
    await h[IPC.cliSave]({}, cli)
    for (const op of ['meta.doctor', 'config.set', '../x', 5]) {
      expect((await h[IPC.call]({}, { op })).error.code).toBe('invalid_request')
    }
  })
  it('maps the write and quarantine operations to fixed CLI commands with the main-process appId', async () => {
    const { h, cli } = setup()
    await h[IPC.cliSave]({}, cli)
    const cases: [string, string[]][] = [
      ['content.create', ['content', 'create']], ['content.update', ['content', 'update']], ['content.delete', ['content', 'delete']],
      ['quarantine.list', ['quarantine', 'list']], ['quarantine.count', ['quarantine', 'count']], ['quarantine.reject', ['quarantine', 'reject']],
      ['quarantine.acceptSheets', ['quarantine', 'accept-sheets']], ['quarantine.applyLocal', ['quarantine', 'apply-local']],
      ['quarantine.fix', ['quarantine', 'fix']], ['quarantine.deleteRecord', ['quarantine', 'delete-record']], ['quarantine.scan', ['quarantine', 'scan']]
    ]
    for (const [op, argv] of cases) {
      const r = await h[IPC.call]({}, { op, payload: { appId: 'admin', content: 'departments', id: 'x' } })
      expect(r.data.argv).toEqual(argv)
      expect(r.data.body.appId).toBe('my-app')
    }
  })
  it('keeps passwords out of argv on writes', async () => {
    const { h, cli } = setup()
    await h[IPC.cliSave]({}, cli)
    const r = await h[IPC.call]({}, { op: 'content.create', payload: { content: 'employees', record: { password: 'hunter2' } } })
    expect(JSON.stringify(r.data.argv)).not.toContain('hunter2')
    expect(r.data.body.record.password).toBe('hunter2')
  })
  it('uses the long timeout only for sync.run and quarantine.scan', () => {
    expect([...LONG_OPS].sort()).toEqual(['quarantine.scan', 'sync.run'])
  })
})
