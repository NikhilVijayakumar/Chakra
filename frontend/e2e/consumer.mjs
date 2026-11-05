// e2e: node e2e/consumer.mjs <chakra-cli> <seeded CHAKRA_HOME>   (run under xvfb-run after `electron-vite build`)
import { _electron as electron } from '@playwright/test'
import { mkdtempSync, copyFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import assert from 'node:assert'

const [cli, home] = process.argv.slice(2)
const ud = mkdtempSync(join(tmpdir(), 'chakra-ud-'))
copyFileSync(join(home, 'c.sqlite'), join(home, 'chakra.sqlite'))
const app = await electron.launch({ args: ['.', '--no-sandbox', `--user-data-dir=${ud}`], env: { ...process.env, CHAKRA_HOME: home } })
const w = await app.firstWindow()
const t = 20_000
await w.getByLabel('Path to the Chakra CLI executable').fill(cli)
await w.getByRole('button', { name: 'Verify' }).click()
await w.getByTestId('verify-result').waitFor({ timeout: t })
await w.getByRole('button', { name: 'Save' }).click()

await w.getByLabel('Email', { exact: true }).fill('asha@x.com')
await w.getByLabel('Password', { exact: true }).fill('secret')
await w.getByRole('button', { name: 'Sign in' }).click()
await w.getByText('Hello Asha').waitFor({ timeout: t })
assert.ok(await w.getByText(/App chakra-demo/).isVisible())
// writes through the library: add, see it, validation message, delete
await w.getByLabel('New department').fill('Ops')
await w.getByRole('button', { name: 'Add' }).click()
const ops = w.getByRole('listitem').filter({ hasText: 'Ops' })
await ops.waitFor({ timeout: t })
await w.getByRole('button', { name: 'Add' }).click() // empty name
await w.getByText(/name is required/).waitFor({ timeout: t })
await w.getByRole('button', { name: 'delete Ops' }).click()
await ops.waitFor({ state: 'detached', timeout: t })
console.log('E2E OK:', await w.locator('#root').innerText())
await app.close()
