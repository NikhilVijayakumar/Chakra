# feat(google-sheets): add googleSheetsManagementService for spreadsheet and tab lifecycle

## Background

`googleSheetsCacheService` handles bidirectional data sync between Google Sheets tabs and
SQLite tables. It is the right tool for reading and writing rows.

What it cannot do is **manage the spreadsheet itself**: create a new workbook, add or rename
tabs, write arbitrary formatted cell blocks, or attach data validation rules to a cell range.
These are all Sheets / Drive API operations that operate on the _structure_ of a spreadsheet,
not its row data.

The planned attendance system (Rita) needs exactly these operations for its **year
initialization** flow:

1. Create a new Google Spreadsheet for the year (e.g. "Attendance 2026").
2. Add 12 monthly tabs (Jan, Feb … Dec) if they don't already exist.
3. Write formatted calendar headers into each tab — employee names as row headers, day columns
   with weekday labels (Mon 1, Tue 2 …), pre-filled `S` for Saturdays/Sundays and `H` for
   public holidays.
4. Apply data validation on attendance cells so only recognised keys (P, CL, ML, WFH/P …) can
   be entered.

None of this is app-specific logic. Any Prana-based app that needs to provision or format a
Google Spreadsheet would need these same primitives. Keeping them in Prana means Rita, the DHI
director system, and future apps get them for free.

> **Prerequisite:** This PR depends on
> `docs/pr/prana/service-account-auth-for-google-sheets-cache.md` landing first. All functions
> here accept `GoogleSheetsCredentials` (the union type introduced by that PR), so they work
> with both service accounts and OAuth callers.

---

## Files to change

| File | Change |
|------|--------|
| `src/main/services/googleSheetsManagementService.ts` | **New file** — spreadsheet/tab lifecycle and cell formatting primitives |

No existing files change. No breaking changes.

---

## Proposed API surface

### New file — `googleSheetsManagementService.ts`

```typescript
import type { GoogleSheetsCredentials } from './googleSheetsCacheService'
import { resolveAccessToken } from './googleSheetsCacheService'   // package-internal export

const SHEETS_BASE = 'https://sheets.googleapis.com/v4/spreadsheets'
const DRIVE_FILES  = 'https://www.googleapis.com/drive/v3/files'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SpreadsheetInfo {
  spreadsheetId: string
  title: string
  url: string
}

export interface TabInfo {
  sheetId: number
  title: string
}

export interface CellRange {
  /** 0-based row index (inclusive). */
  startRowIndex: number
  /** 0-based row index (exclusive). */
  endRowIndex: number
  /** 0-based column index (inclusive). */
  startColumnIndex: number
  /** 0-based column index (exclusive). */
  endColumnIndex: number
}

// ---------------------------------------------------------------------------
// Spreadsheet lifecycle
// ---------------------------------------------------------------------------

/**
 * Creates a new Google Spreadsheet and returns its ID and URL.
 * The service account (or OAuth user) must have Drive write access.
 */
export const createSpreadsheet = async (
  title: string,
  credentials: GoogleSheetsCredentials,
): Promise<SpreadsheetInfo> => {
  const token = await resolveAccessToken(credentials)
  const res = await fetch(SHEETS_BASE, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ properties: { title } }),
  })
  if (!res.ok) throw new Error(`[SheetsManagement] createSpreadsheet failed (${res.status}): ${await res.text()}`)
  const data = await res.json() as { spreadsheetId: string; properties: { title: string }; spreadsheetUrl: string }
  return { spreadsheetId: data.spreadsheetId, title: data.properties.title, url: data.spreadsheetUrl }
}

/**
 * Finds a spreadsheet in Drive by its exact title.
 * Returns the spreadsheet ID if found, null if not found.
 * Useful before calling createSpreadsheet to avoid duplicates.
 */
export const findSpreadsheetByTitle = async (
  title: string,
  credentials: GoogleSheetsCredentials,
): Promise<string | null> => {
  const token = await resolveAccessToken(credentials)
  const q = encodeURIComponent(`name='${title}' and mimeType='application/vnd.google-apps.spreadsheet' and trashed=false`)
  const res = await fetch(`${DRIVE_FILES}?q=${q}&fields=files(id,name)`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error(`[SheetsManagement] findSpreadsheetByTitle failed (${res.status}): ${await res.text()}`)
  const data = await res.json() as { files: { id: string; name: string }[] }
  return data.files[0]?.id ?? null
}

// ---------------------------------------------------------------------------
// Tab management
// ---------------------------------------------------------------------------

/**
 * Returns all tabs in a spreadsheet.
 */
export const listTabs = async (
  spreadsheetId: string,
  credentials: GoogleSheetsCredentials,
): Promise<TabInfo[]> => {
  const token = await resolveAccessToken(credentials)
  const res = await fetch(`${SHEETS_BASE}/${spreadsheetId}?fields=sheets.properties`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error(`[SheetsManagement] listTabs failed (${res.status}): ${await res.text()}`)
  const data = await res.json() as { sheets: { properties: { sheetId: number; title: string } }[] }
  return data.sheets.map(s => ({ sheetId: s.properties.sheetId, title: s.properties.title }))
}

/**
 * Adds a tab if it does not already exist.
 * Returns the sheetId (new or existing).
 */
export const ensureTab = async (
  spreadsheetId: string,
  tabTitle: string,
  credentials: GoogleSheetsCredentials,
): Promise<number> => {
  const existing = await listTabs(spreadsheetId, credentials)
  const found = existing.find(t => t.title === tabTitle)
  if (found) return found.sheetId

  const token = await resolveAccessToken(credentials)
  const res = await fetch(`${SHEETS_BASE}/${spreadsheetId}:batchUpdate`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      requests: [{ addSheet: { properties: { title: tabTitle } } }],
    }),
  })
  if (!res.ok) throw new Error(`[SheetsManagement] ensureTab failed (${res.status}): ${await res.text()}`)
  const data = await res.json() as { replies: [{ addSheet: { properties: { sheetId: number } } }] }
  return data.replies[0].addSheet.properties.sheetId
}

// ---------------------------------------------------------------------------
// Cell writes
// ---------------------------------------------------------------------------

/**
 * Writes a 2-D array of values to a sheet starting at the given A1 cell.
 * Uses RAW input (values are not interpreted as formulas).
 */
export const writeRange = async (
  spreadsheetId: string,
  tab: string,
  startCell: string,       // e.g. 'A1'
  values: string[][],
  credentials: GoogleSheetsCredentials,
): Promise<void> => {
  const token = await resolveAccessToken(credentials)
  const range = `${tab}!${startCell}`
  const res = await fetch(
    `${SHEETS_BASE}/${spreadsheetId}/values/${encodeURIComponent(range)}?valueInputOption=RAW`,
    {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ range, majorDimension: 'ROWS', values }),
    },
  )
  if (!res.ok) throw new Error(`[SheetsManagement] writeRange failed (${res.status}): ${await res.text()}`)
}

// ---------------------------------------------------------------------------
// Data validation
// ---------------------------------------------------------------------------

/**
 * Restricts a cell range to a list of allowed string values (dropdown list).
 * Used by Rita to enforce valid attendance keys on attendance cells.
 * Rejects input that is not in the list and shows a dropdown in the Sheets UI.
 */
export const setDropdownValidation = async (
  spreadsheetId: string,
  sheetId: number,
  range: CellRange,
  allowedValues: string[],
  credentials: GoogleSheetsCredentials,
): Promise<void> => {
  const token = await resolveAccessToken(credentials)
  const res = await fetch(`${SHEETS_BASE}/${spreadsheetId}:batchUpdate`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      requests: [{
        setDataValidation: {
          range: {
            sheetId,
            startRowIndex:    range.startRowIndex,
            endRowIndex:      range.endRowIndex,
            startColumnIndex: range.startColumnIndex,
            endColumnIndex:   range.endColumnIndex,
          },
          rule: {
            condition: {
              type: 'ONE_OF_LIST',
              values: allowedValues.map(v => ({ userEnteredValue: v })),
            },
            strict: true,
            showCustomUi: true,
          },
        },
      }],
    }),
  })
  if (!res.ok) throw new Error(`[SheetsManagement] setDropdownValidation failed (${res.status}): ${await res.text()}`)
}

export const googleSheetsManagementService = {
  /** Create a new Google Spreadsheet and return its ID. */
  createSpreadsheet,
  /** Search Drive for an existing spreadsheet by exact title. */
  findSpreadsheetByTitle,
  /** List all tabs in a spreadsheet. */
  listTabs,
  /** Add a tab if it doesn't exist; return its sheetId. */
  ensureTab,
  /** Write a 2-D value array at a given cell position. */
  writeRange,
  /** Restrict a cell range to a dropdown of allowed values. */
  setDropdownValidation,
}
```

---

## What Rita uses from this service

### Year initialization sequence

```typescript
import { googleSheetsManagementService } from 'prana/main/services/googleSheetsManagementService'
import { googleSheetsCacheService }      from 'prana/main/services/googleSheetsCacheService'
import type { GoogleSheetsCredentials }  from 'prana/main/services/googleSheetsCacheService'

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
const KEY_PATH = resolveServiceAccountKeyPath()
const credentials: GoogleSheetsCredentials = { type: 'service_account', keyPath: KEY_PATH }

// 1. Find or create the year spreadsheet
let spreadsheetId = await googleSheetsManagementService.findSpreadsheetByTitle(`Attendance ${year}`, credentials)
if (!spreadsheetId) {
  const created = await googleSheetsManagementService.createSpreadsheet(`Attendance ${year}`, credentials)
  spreadsheetId = created.spreadsheetId
}

// 2. Ensure 12 monthly tabs exist
for (const month of MONTHS) {
  await googleSheetsManagementService.ensureTab(spreadsheetId, month, credentials)
}

// 3. Write calendar headers and pre-fill S/H for each month
for (let m = 0; m < 12; m++) {
  const { headers, prefill } = buildMonthCalendar(year, m, employees, holidays)
  const sheetId = (await googleSheetsManagementService.listTabs(spreadsheetId, credentials))
    .find(t => t.title === MONTHS[m])!.sheetId

  await googleSheetsManagementService.writeRange(spreadsheetId, MONTHS[m], 'A1', headers, credentials)

  // 4. Restrict attendance cells to valid keys
  await googleSheetsManagementService.setDropdownValidation(
    spreadsheetId, sheetId,
    { startRowIndex: 2, endRowIndex: 2 + employees.length, startColumnIndex: 1, endColumnIndex: 1 + daysInMonth },
    attendanceKeys,
    credentials,
  )
}
```

The `buildMonthCalendar` function is Rita-specific app logic (Astra layer) and does not belong
in Prana. Prana supplies only the raw API primitives above.

### Attendance sync (pull / push)

Attendance row data is synced through the existing `googleSheetsCacheService` — no new Prana
code needed there, as long as the service account PR has landed.

```typescript
// Pull one month's attendance into SQLite
await googleSheetsCacheService.pullFromSheets({
  spreadsheetId,
  credentials,
  mappings: [{
    sheetTab:    'Jan',
    sqliteTable: 'attendance_jan',
    syncMode:    'upsert',
    columns: [
      { sheetHeader: 'Employee', sqliteColumn: 'employee_id', type: 'TEXT', primaryKey: true },
      // day columns 1..31 as TEXT
      ...Array.from({ length: 31 }, (_, i) => ({
        sheetHeader: String(i + 1), sqliteColumn: `day_${i + 1}`, type: 'TEXT' as const,
      })),
    ],
  }],
})

// Push offline edits back to the sheet
await googleSheetsCacheService.pushToSheets({ spreadsheetId, credentials, mappings: [...] })
```

---

## Summary of changes in Prana

| | Before | After |
|---|---|---|
| Spreadsheet creation | Not possible | `createSpreadsheet` |
| Tab discovery | Not possible | `listTabs`, `ensureTab` |
| Raw cell writes | Via `pushToSheets` (row-oriented only) | Also `writeRange` (any range, any format) |
| Data validation | Not possible | `setDropdownValidation` |
| New files | — | `googleSheetsManagementService.ts` |
| Changed files | None | None |
| Breaking changes | None | None |

## Prerequisites

This PR must be merged after:
1. `service-account-auth-for-google-sheets-cache` — provides `GoogleSheetsCredentials` union
   type and the `resolveAccessToken` internal export that this service calls.
