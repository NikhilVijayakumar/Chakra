# feat(google-sheets): add service account authentication to `googleSheetsCacheService`

## Background

`googleSheetsCacheService` is a well-designed generic engine for bidirectional
Google Sheets ↔ SQLite sync. It accepts a declarative `SheetTabMapping[]` from
the calling app and handles all API calls, schema creation, and SQLite writes
internally.

The problem: it currently only accepts `GoogleBridgeCredentials` (OAuth —
clientId + clientSecret + refreshToken). Unattended server apps and
multi-tenant platforms need **service account** authentication, where a local
JSON key file signs a JWT to obtain an access token — no user login, no OAuth
flow, no stored refresh tokens.

Every Prana-based app that needs Google Sheets with a service account today
must implement its own JWT signing, token exchange, and caching. This is being
duplicated in Chakra already (`googleServiceAccountService.ts`) and will be
duplicated again in the planned attendance system and DHI director system.

The fix is a single surgical addition to `googleSheetsCacheService` — the rest
of the service (schema, pull, push, column mapping) is correct as-is.

---

## Files to change

| File | Change |
|------|--------|
| `src/main/services/googleSheetsCacheService.ts` | Add `ServiceAccountCredentials` type, extend `resolveAccessToken` to handle both credential kinds |
| `src/main/services/googleServiceAccountTokenService.ts` | **New file** — JWT signing + token caching, extracted so other services can reuse it |

No other files need to change. `GoogleBridgeCredentials` and all existing
callers are untouched.

---

## Proposed API surface

### 1. New file — `googleServiceAccountTokenService.ts`

```typescript
import { createSign } from 'node:crypto'
import { existsSync } from 'node:fs'
import { readFile } from 'node:fs/promises'

export interface ServiceAccountKey {
  client_email: string
  private_key: string
  token_uri: string
}

interface TokenCache {
  token: string
  expiresAt: number
}

// One cache entry per key-path so multiple apps using different service
// accounts in the same process don't collide.
const tokenCache = new Map<string, TokenCache>()

const b64url = (buf: Buffer): string =>
  buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')

const signJwt = (key: ServiceAccountKey, scopes: string): string => {
  const now = Math.floor(Date.now() / 1000)
  const header  = b64url(Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })))
  const payload = b64url(Buffer.from(JSON.stringify({
    iss: key.client_email,
    scope: scopes,
    aud: key.token_uri,
    exp: now + 3600,
    iat: now,
  })))
  const unsigned = `${header}.${payload}`
  const signer = createSign('RSA-SHA256')
  signer.update(unsigned)
  return `${unsigned}.${b64url(signer.sign(key.private_key))}`
}

/**
 * Returns a valid Bearer token for the given service account key file.
 * Tokens are cached per keyPath and refreshed 60 s before expiry.
 *
 * @param keyPath  Absolute path to the service account JSON key file.
 * @param scopes   Space-separated OAuth scope string.
 */
export const getServiceAccountToken = async (
  keyPath: string,
  scopes: string,
): Promise<string> => {
  const cached = tokenCache.get(keyPath)
  if (cached && Date.now() < cached.expiresAt - 60_000) return cached.token

  if (!existsSync(keyPath)) {
    throw new Error(`[ServiceAccount] Key file not found: ${keyPath}`)
  }

  const key: ServiceAccountKey = JSON.parse(await readFile(keyPath, 'utf-8'))
  const jwt = signJwt(key, scopes)

  const res = await fetch(key.token_uri, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }).toString(),
  })

  if (!res.ok) {
    throw new Error(`[ServiceAccount] Token exchange failed (${res.status}): ${await res.text()}`)
  }

  const data = (await res.json()) as { access_token: string; expires_in: number }
  const entry: TokenCache = { token: data.access_token, expiresAt: Date.now() + data.expires_in * 1000 }
  tokenCache.set(keyPath, entry)
  return entry.token
}

/**
 * Returns the client_email from the key file without making a network call.
 * Useful for status/health checks.
 */
export const readServiceAccountEmail = async (keyPath: string): Promise<string> => {
  const key: ServiceAccountKey = JSON.parse(await readFile(keyPath, 'utf-8'))
  return key.client_email
}
```

---

### 2. Changes to `googleSheetsCacheService.ts`

#### Add `ServiceAccountCredentials` and a credentials union type

```typescript
// New — add alongside existing GoogleBridgeCredentials import
export interface ServiceAccountCredentials {
  type: 'service_account'
  /** Absolute path to the service account JSON key file. */
  keyPath: string
}

/**
 * Either OAuth credentials (existing) or a service account key path (new).
 * All googleSheetsCacheService functions accept both interchangeably.
 */
export type GoogleSheetsCredentials = GoogleBridgeCredentials | ServiceAccountCredentials
```

#### Replace the internal `refreshToken` helper with `resolveAccessToken`

```typescript
// Remove:
const refreshToken = async (credentials: GoogleBridgeCredentials): Promise<string> => { ... }

// Add:
const SHEETS_SCOPE = 'https://www.googleapis.com/auth/spreadsheets'

const resolveAccessToken = async (credentials: GoogleSheetsCredentials): Promise<string> => {
  if ('type' in credentials && credentials.type === 'service_account') {
    return getServiceAccountToken(credentials.keyPath, SHEETS_SCOPE)
  }
  // existing OAuth path — unchanged
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: credentials.clientId,
      client_secret: credentials.clientSecret,
      refresh_token: credentials.refreshToken,
      grant_type: 'refresh_token',
    }).toString(),
  })
  if (!res.ok) throw new Error(`[SheetsCache] Token refresh failed: ${res.status} ${res.statusText}`)
  const data = await res.json() as { access_token?: string }
  if (!data.access_token) throw new Error('[SheetsCache] Token refresh returned no access_token.')
  return data.access_token
}
```

#### Update `GoogleSheetsSyncRequest`

```typescript
export interface GoogleSheetsSyncRequest {
  spreadsheetId: string
  // Was: credentials: GoogleBridgeCredentials
  credentials: GoogleSheetsCredentials   // ← only change
  mappings: SheetTabMapping[]
}
```

#### Update all internal call sites (two places)

```typescript
// In pullFromSheets:
const accessToken = await resolveAccessToken(request.credentials)  // was: refreshToken(...)

// In pushToSheets:
const accessToken = await resolveAccessToken(request.credentials)  // was: refreshToken(...)
```

That is the entire diff. No other logic changes.

---

## What callers look like after this PR

### Service account caller (new pattern — Chakra, attendance, DHI)

```typescript
import { googleSheetsCacheService } from 'prana/main/services/googleSheetsCacheService'
import { join } from 'node:path'

const KEY_PATH = join(process.cwd(), 'config', 'chakra-service-account.json')
const SHEET_ID = '1Jq0QyQAybIlrgNAlsolpGH30WsyuwOmKSTsTeVcEwq0'

const mappings = [
  {
    sheetTab: 'Department',
    sqliteTable: 'departments',
    syncMode: 'replace' as const,
    columns: [
      { sheetHeader: 'ID',     sqliteColumn: 'department_id',   type: 'TEXT' as const, primaryKey: true },
      { sheetHeader: 'Name',   sqliteColumn: 'department_name', type: 'TEXT' as const },
      { sheetHeader: 'Status', sqliteColumn: 'status',          type: 'TEXT' as const },
    ],
  },
  {
    sheetTab: 'Designation',
    sqliteTable: 'designations',
    syncMode: 'replace' as const,
    columns: [
      { sheetHeader: 'ID',     sqliteColumn: 'designation_id',   type: 'TEXT' as const, primaryKey: true },
      { sheetHeader: 'Name',   sqliteColumn: 'designation_name', type: 'TEXT' as const },
      { sheetHeader: 'Status', sqliteColumn: 'status',           type: 'TEXT' as const },
    ],
  },
  {
    sheetTab: 'Employee',
    sqliteTable: 'employees',
    syncMode: 'replace' as const,
    columns: [
      { sheetHeader: 'ID',             sqliteColumn: 'employee_id',    type: 'TEXT' as const, primaryKey: true },
      { sheetHeader: 'Name',           sqliteColumn: 'full_name',      type: 'TEXT' as const },
      { sheetHeader: 'email',          sqliteColumn: 'email',          type: 'TEXT' as const },
      { sheetHeader: 'password_hash',  sqliteColumn: 'password_hash',  type: 'TEXT' as const },
      { sheetHeader: 'department_id',  sqliteColumn: 'department_id',  type: 'TEXT' as const },
      { sheetHeader: 'designation_id', sqliteColumn: 'designation_id', type: 'TEXT' as const },
      { sheetHeader: 'Status',         sqliteColumn: 'status',         type: 'TEXT' as const },
    ],
    foreignKeys: [
      { column: 'department_id',  referencesTable: 'departments',  referencesColumn: 'department_id' },
      { column: 'designation_id', referencesTable: 'designations', referencesColumn: 'designation_id' },
    ],
  },
]

// Ensure tables exist, then pull all tabs
await googleSheetsCacheService.ensureSchema({ spreadsheetId: SHEET_ID, credentials: { type: 'service_account', keyPath: KEY_PATH }, mappings })
const result = await googleSheetsCacheService.pullFromSheets({ spreadsheetId: SHEET_ID, credentials: { type: 'service_account', keyPath: KEY_PATH }, mappings })
```

### OAuth caller (unchanged — existing Prana operations still work)

```typescript
// No change required — GoogleBridgeCredentials continues to work as before
const result = await googleSheetsCacheService.pullFromSheets({
  spreadsheetId: '...',
  credentials: { clientId, clientSecret, refreshToken },   // existing shape
  mappings: [...]
})
```

---

## What Chakra removes after this PR lands

Once Prana ships this, Chakra deletes three files entirely:

| File deleted | Replaced by |
|---|---|
| `src/main/services/googleServiceAccountService.ts` | `googleServiceAccountTokenService` inside Prana |
| `src/main/services/googleSheetsService.ts` | `fetchTabValues` inside Prana's cache service |
| `src/main/services/sheetsSyncService.ts` | A single `pullFromSheets` call with the mapping table above |

`employeeStoreService.ts` keeps only `getStoredSheetId` / `saveEmployeeSheetId` (the
SQLite KV for the sheet ID). All table schema and data writes move to Prana.

The IPC handler `chakra:sheets-sync` shrinks from ~30 lines to ~10:

```typescript
ipcMain.handle('chakra:sheets-sync', async () => {
  const zeros = { departmentsLoaded: 0, designationsLoaded: 0, employeesLoaded: 0 }
  try {
    const spreadsheetId = (await employeeStore.getStoredSheetId()) ?? runtimeEnvValue('GOOGLE_EMPLOYEE_SHEET_ID') ?? ''
    if (!spreadsheetId) return { success: false, errors: ['Spreadsheet ID not configured.'], ...zeros }

    const result = await googleSheetsCacheService.pullFromSheets({
      spreadsheetId,
      credentials: { type: 'service_account', keyPath: resolveServiceAccountKeyPath() },
      mappings: HR_SHEET_MAPPINGS,  // the mapping table declared once as a constant
    })

    const byTable = Object.fromEntries(result.tabs.map(t => [t.table, t]))
    return {
      success: result.tabs.every(t => t.status === 'OK'),
      departmentsLoaded:  byTable['departments']?.rowsAffected  ?? 0,
      designationsLoaded: byTable['designations']?.rowsAffected ?? 0,
      employeesLoaded:    byTable['employees']?.rowsAffected    ?? 0,
      errors: result.tabs.filter(t => t.status === 'FAILED').map(t => `${t.tab}: ${t.error}`),
    }
  } catch (err) {
    return { success: false, errors: [(err as Error).message], ...zeros }
  }
})
```

---

## Future apps (zero Google code required)

For the attendance system or DHI director system, the entire Google integration is:

```typescript
// 1. Put service-account.json in config/
// 2. Declare mappings for your tabs
// 3. Call pull or push — done

await googleSheetsCacheService.pullFromSheets({
  spreadsheetId: ATTENDANCE_SHEET_ID,
  credentials: { type: 'service_account', keyPath: KEY_PATH },
  mappings: [
    {
      sheetTab: 'Attendance',
      sqliteTable: 'attendance_records',
      syncMode: 'upsert',
      columns: [
        { sheetHeader: 'Date',        sqliteColumn: 'date',        type: 'TEXT', primaryKey: true },
        { sheetHeader: 'Employee ID', sqliteColumn: 'employee_id', type: 'TEXT', primaryKey: true },
        { sheetHeader: 'Status',      sqliteColumn: 'status',      type: 'TEXT' },
        { sheetHeader: 'Notes',       sqliteColumn: 'notes',       type: 'TEXT' },
      ],
    },
  ],
})
```

No JWT code. No HTTP client. No SQL. Just the mapping declaration.

---

## Summary of changes in Prana

| | Before | After |
|---|---|---|
| Auth methods supported | OAuth only | OAuth + Service Account |
| New files | — | `googleServiceAccountTokenService.ts` |
| Changed files | `googleSheetsCacheService.ts` | `googleSheetsCacheService.ts` (3 lines changed) |
| Breaking changes | None | None |
| Existing callers | Work unchanged | Work unchanged |
| Token caching | Per-request refresh (OAuth) | Per-keyPath cache, 60 s buffer (service account) |
