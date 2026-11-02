/**
 * Standalone test: service account → Google Sheets access
 * Run with:  node scripts/test-sheets-access.mjs
 */

import { createSign } from 'node:crypto'
import { readFileSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const SHEET_ID = '1Jq0QyQAybIlrgNAlsolpGH30WsyuwOmKSTsTeVcEwq0'
const SCOPES = 'https://www.googleapis.com/auth/spreadsheets'

// ── 1. Resolve key file ───────────────────────────────────────────────────
const candidates = [
  join(ROOT, 'config', 'chakra-service-account.json'),
  join(ROOT, 'config', 'chakra-494418-bddcc85e4c64.json')
]
const keyPath = candidates.find(existsSync)
if (!keyPath) {
  console.error('❌  Key file not found. Expected at config/chakra-service-account.json')
  process.exit(1)
}
const key = JSON.parse(readFileSync(keyPath, 'utf-8'))
console.log(`✅  Key file:  ${keyPath}`)
console.log(`    Account:  ${key.client_email}`)

// ── 2. Sign JWT ───────────────────────────────────────────────────────────
const b64url = (buf) =>
  buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')

const now = Math.floor(Date.now() / 1000)
const header  = b64url(Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })))
const payload = b64url(Buffer.from(JSON.stringify({
  iss: key.client_email,
  scope: SCOPES,
  aud: key.token_uri,
  exp: now + 3600,
  iat: now
})))
const unsigned = `${header}.${payload}`
const signer = createSign('RSA-SHA256')
signer.update(unsigned)
const jwt = `${unsigned}.${b64url(signer.sign(key.private_key))}`
console.log(`✅  JWT signed`)

// ── 3. Exchange JWT for access token ─────────────────────────────────────
console.log(`\n⏳  Exchanging JWT for access token ...`)
const tokenRes = await fetch(key.token_uri, {
  method: 'POST',
  headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  body: new URLSearchParams({
    grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
    assertion: jwt
  }).toString()
})
if (!tokenRes.ok) {
  const body = await tokenRes.text()
  console.error(`❌  Token exchange failed (${tokenRes.status}): ${body}`)
  process.exit(1)
}
const { access_token, expires_in } = await tokenRes.json()
console.log(`✅  Access token obtained (expires in ${expires_in}s)`)

const headers = { Authorization: `Bearer ${access_token}` }

// ── 4. List sheet tabs ────────────────────────────────────────────────────
console.log(`\n⏳  Reading spreadsheet metadata ...`)
const metaRes = await fetch(
  `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}?fields=spreadsheetId,properties.title,sheets.properties`,
  { headers }
)
if (!metaRes.ok) {
  const body = await metaRes.text()
  console.error(`❌  Metadata read failed (${metaRes.status}): ${body}`)
  process.exit(1)
}
const meta = await metaRes.json()
console.log(`✅  Spreadsheet: "${meta.properties?.title}"`)
const tabs = meta.sheets?.map(s => s.properties?.title) ?? []
console.log(`    Tabs (${tabs.length}): ${tabs.join(', ')}`)

// ── 5. Read each expected tab ─────────────────────────────────────────────
for (const tab of ['Departments', 'Designations', 'Employees']) {
  if (!tabs.includes(tab)) {
    console.log(`\n⚠️   Tab "${tab}" not found — skipping`)
    continue
  }
  console.log(`\n⏳  Reading "${tab}" tab ...`)
  const range = encodeURIComponent(`${tab}!A1:Z5`)
  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${range}`,
    { headers }
  )
  if (!res.ok) {
    console.error(`❌  Read "${tab}" failed (${res.status}): ${await res.text()}`)
    continue
  }
  const { values } = await res.json()
  if (!values?.length) {
    console.log(`⚠️   "${tab}" is empty`)
    continue
  }
  const [header, ...rows] = values
  console.log(`✅  "${tab}" — ${rows.length} data rows (showing up to 3):`)
  console.log(`    Header: [${header.join(' | ')}]`)
  for (const row of rows.slice(0, 3)) {
    console.log(`    Row:    [${row.join(' | ')}]`)
  }
}

// ── 6. Test write access (append a test row then delete it) ───────────────
console.log(`\n⏳  Testing write access (append + delete on Employees) ...`)
if (tabs.includes('Employees')) {
  const appendRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/Employees!A1:A1:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS`,
    {
      method: 'POST',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ values: [['__chakra_test__', 'Test', 'test@chakra.local', '', 'staff', '', '', 'inactive']] })
    }
  )
  if (appendRes.ok) {
    const appendData = await appendRes.json()
    const updatedRange = appendData.updates?.updatedRange ?? ''
    console.log(`✅  Write access confirmed (appended to ${updatedRange})`)

    // Delete the test row
    const rowMatch = updatedRange.match(/!A(\d+)/)
    if (rowMatch) {
      const rowIndex = parseInt(rowMatch[1]) - 1  // 0-based
      const sheetId = meta.sheets?.find(s => s.properties?.title === 'Employees')?.properties?.sheetId ?? 0
      const deleteRes = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}:batchUpdate`,
        {
          method: 'POST',
          headers: { ...headers, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            requests: [{
              deleteDimension: {
                range: { sheetId, dimension: 'ROWS', startIndex: rowIndex, endIndex: rowIndex + 1 }
              }
            }]
          })
        }
      )
      if (deleteRes.ok) {
        console.log(`✅  Test row cleaned up`)
      } else {
        console.log(`⚠️   Could not clean up test row — delete it manually (row ${rowIndex + 1})`)
      }
    }
  } else {
    const body = await appendRes.text()
    console.error(`❌  Write access failed (${appendRes.status}): ${body}`)
  }
} else {
  console.log(`⚠️   Employees tab not found — skipping write test`)
}

console.log(`\n🎉  All checks complete`)
