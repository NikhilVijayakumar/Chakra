# Project Rita: Automated Attendance Orchestrator

**Rita** (inspired by the Sanskrit *Ṛta* — the cosmic order) is the first integrated app inside
Chakra. After a user logs in to Chakra, Rita loads as the primary workspace and provides
organisation-wide attendance management backed by Google Sheets and a local SQLite cache.

---

## 1. System Architecture

Rita follows the same **Astra + Prana** layering that all Chakra-hosted apps use:

| Layer | Role in Rita |
|-------|-------------|
| **Astra** (Electron/React UI) | Rita-specific screens: attendance grid, year initialiser, sync status, key legend. No Astra code is shared with Chakra. |
| **Prana** (Node.js core) | Google Sheets API calls, SQLite cache management, service account token handling. All Prana services are shared across Chakra and every hosted app. |
| **Google Sheets** | Acts as the authoritative remote database. The Master spreadsheet holds configuration; yearly spreadsheets hold attendance records. |
| **SQLite** | Prana's local cache (`chakra.sqlite`). Attendance edits are written here first; a sync pushes them back to Google Sheets. |

Rita does **not** share any UI component with Chakra. Chakra handles authentication and
launches Rita post-login. From that point on, all screens the user sees are Rita's own Astra
views.

### Offline-First Data Flow

```
Google Sheets (authoritative)
        │  pull on startup / manual refresh
        ▼
SQLite cache (chakra.sqlite)
        │  user edits attendance cells locally
        ▼
SQLite cache (dirty rows)
        │  push on manual sync / scheduled sync
        ▼
Google Sheets (updated)
```

This means Rita works without a live internet connection during the day. Edits accumulate in
the local cache and are flushed to Sheets on demand.

---

## 2. Google Sheets Schema

Rita uses **two kinds of spreadsheets**:

### Master Spreadsheet (one, permanent)

A single Google Spreadsheet shared with the service account. All configuration lives here.

| Tab name | Purpose | Key columns |
|----------|---------|-------------|
| `_Master_Employees` | Active employee roster | `employee_id`, `full_name`, `email`, `dept_id`, `desig_id`, `status` |
| `_Master_Departments` | Department ID → name map | `dept_id`, `dept_name`, `status` |
| `_Master_Designations` | Designation ID → name map | `desig_id`, `desig_name`, `status` |
| `_Holidays` | National and Kerala regional holidays | `date` (YYYY-MM-DD), `description`, `region` |
| `_Settings_Keys` | Attendance key library | `key`, `label`, `half_day` (boolean) |

The Master Sheet is **read-only from Rita's perspective** — all writes go to attendance sheets.
It is pulled into SQLite at startup so the rest of the app works offline.

#### Master Sheet SQLite mapping (via `googleSheetsCacheService.pullFromSheets`)

```typescript
const MASTER_MAPPINGS: SheetTabMapping[] = [
  {
    sheetTab: '_Master_Employees', sqliteTable: 'employees', syncMode: 'replace',
    columns: [
      { sheetHeader: 'employee_id', sqliteColumn: 'employee_id', type: 'TEXT', primaryKey: true },
      { sheetHeader: 'full_name',   sqliteColumn: 'full_name',   type: 'TEXT' },
      { sheetHeader: 'email',       sqliteColumn: 'email',       type: 'TEXT' },
      { sheetHeader: 'dept_id',     sqliteColumn: 'dept_id',     type: 'TEXT' },
      { sheetHeader: 'desig_id',    sqliteColumn: 'desig_id',    type: 'TEXT' },
      { sheetHeader: 'status',      sqliteColumn: 'status',      type: 'TEXT' },
    ],
  },
  {
    sheetTab: '_Master_Departments', sqliteTable: 'departments', syncMode: 'replace',
    columns: [
      { sheetHeader: 'dept_id',   sqliteColumn: 'dept_id',   type: 'TEXT', primaryKey: true },
      { sheetHeader: 'dept_name', sqliteColumn: 'dept_name', type: 'TEXT' },
      { sheetHeader: 'status',    sqliteColumn: 'status',    type: 'TEXT' },
    ],
  },
  {
    sheetTab: '_Master_Designations', sqliteTable: 'designations', syncMode: 'replace',
    columns: [
      { sheetHeader: 'desig_id',   sqliteColumn: 'desig_id',   type: 'TEXT', primaryKey: true },
      { sheetHeader: 'desig_name', sqliteColumn: 'desig_name', type: 'TEXT' },
      { sheetHeader: 'status',     sqliteColumn: 'status',     type: 'TEXT' },
    ],
  },
  {
    sheetTab: '_Holidays', sqliteTable: 'holidays', syncMode: 'replace',
    columns: [
      { sheetHeader: 'date',        sqliteColumn: 'date',        type: 'TEXT', primaryKey: true },
      { sheetHeader: 'description', sqliteColumn: 'description', type: 'TEXT' },
      { sheetHeader: 'region',      sqliteColumn: 'region',      type: 'TEXT' },
    ],
  },
  {
    sheetTab: '_Settings_Keys', sqliteTable: 'attendance_keys', syncMode: 'replace',
    columns: [
      { sheetHeader: 'key',      sqliteColumn: 'key',      type: 'TEXT', primaryKey: true },
      { sheetHeader: 'label',    sqliteColumn: 'label',    type: 'TEXT' },
      { sheetHeader: 'half_day', sqliteColumn: 'half_day', type: 'TEXT' },
    ],
  },
]
```

### Yearly Attendance Spreadsheets (one per year)

Each year gets its own Google Spreadsheet (e.g. "Attendance 2026") containing 12 monthly tabs.

**Tab naming:** `Jan`, `Feb`, `Mar` … `Dec`

**Tab structure (one tab = one month):**

```
Row 1 — Header row A: "Employee" | day headers: "Mon 1", "Tue 2", ... "Wed 31"
Row 2+ — One row per employee: employee_id | attendance key per day
```

Day columns for Saturdays and Sundays are pre-filled with `S`. Columns that fall on a holiday
(from `_Holidays`) are pre-filled with `H`. These pre-fills happen during year initialisation
and are not overwritten by the regular sync.

**Data validation:** Attendance cells (Row 2 onwards, columns 2 to N) are restricted to the
values in `_Settings_Keys`. Sheets shows a dropdown; invalid input is rejected.

---

## 3. Year Initialisation Flow

Year initialisation is a one-click operation triggered from Rita's UI. It uses
`googleSheetsManagementService` (Prana) to perform the following steps in sequence:

1. Search Drive for a spreadsheet named "Attendance `<year>`".
2. If not found, create it via `createSpreadsheet`.
3. For each of the 12 months, call `ensureTab` — idempotent, safe to re-run.
4. Build the calendar header row: read the month's days from `date-fns`, mark S/H columns.
5. Write headers and pre-fills to each tab via `writeRange`.
6. Apply `setDropdownValidation` on attendance cells using keys fetched from the local
   `attendance_keys` SQLite table.

The calendar computation and S/H logic lives in Rita's Astra layer (`attendanceCalendarService`).
Prana supplies only the raw Drive/Sheets API calls.

---

## 4. Key Features

### Automated Year Initialisation
One click creates a new Google Spreadsheet for the year, generates 12 tabs, joins employee
IDs and names, and pre-colours the calendar based on the holiday list from the Master Sheet.

### Offline-First Attendance Entry
Users mark attendance against the local SQLite cache without a live network connection. A
manual or scheduled sync pushes dirty rows back to Google Sheets.

### Intelligent Key Processing
Rita supports hybrid keys (e.g. `WFH/CL`, `P/LOP`). The system interprets `/`-separated
values as 0.5 / 0.5 splits for payroll and leave-balance calculations.

### Regional Compliance
Pre-configured for Kerala-based teams: Onam 4-day block, Pooja holidays, Vishu, and all
National Holidays are applied automatically from the `_Holidays` master list.

### Secure Service Account Access
Rita uses a Google Cloud Service Account (JSON key) for all Sheets and Drive operations. No
end-user OAuth flow. The key file is stored locally alongside the app and is never uploaded.

---

## 5. Prana Dependencies

Rita requires two Prana PRs to be merged before its Google Sheets integration can be built.

| Order | PR | What it provides |
|-------|----|----|
| 1 | `service-account-auth-for-google-sheets-cache` | Adds service account auth to `googleSheetsCacheService`. Rita uses this for all master sheet pulls and monthly attendance syncs. |
| 2 | `google-sheets-management-service` | Adds `googleSheetsManagementService` with `createSpreadsheet`, `ensureTab`, `writeRange`, `setDropdownValidation`. Rita uses this for year initialisation. |

Both PRs are documented in `docs/pr/prana/`.

---

## 6. Technology Stack

| Concern | Tool |
|---------|------|
| UI framework | Electron + React (Astra — Rita-specific, not shared with Chakra) |
| Core services | Prana (shared with Chakra and all hosted apps) |
| Google APIs | Sheets API v4, Drive API v3 (via Prana service wrappers) |
| Authentication | Google Cloud Service Account (JWT, no OAuth) |
| Local storage | SQLite via `sql.js` (Prana's `sqliteConfigStoreService`) |
| Calendar logic | `date-fns` |

---

## 7. Setup Prerequisites

1. **Google Cloud Project:** Enable Sheets API v4 and Drive API v3.
2. **Service Account:** Create a service account, generate a JSON key, and share the target
   Google Drive folder (and the Master Spreadsheet) with the service account's email address.
3. **Key file placement:** Save the JSON key to `config/rita-service-account.json` alongside
   the Electron app.
4. **Master Spreadsheet:** Create the Master Sheet with the five tabs described in Section 2
   and populate employee, department, designation, holiday, and key data.
5. **Environment variable:** Set `MAIN_VITE_RITA_MASTER_SHEET_ID` to the Master Spreadsheet ID.
6. **Node.js + Prana:** Ensure Prana is installed with the two prerequisite PRs merged.
