const SHEETS_BASE = 'https://sheets.googleapis.com/v4/spreadsheets'

export interface DepartmentRow {
  department_id: string
  department_name: string
  status: string
}

export interface DesignationRow {
  designation_id: string
  designation_name: string
  status: string
}

export interface EmployeeRow {
  employee_id: string
  full_name: string
  email: string
  password_hash: string
  role: string
  department_id: string
  designation_id: string
  status: string
}

const sheetsGet = async (url: string, accessToken: string): Promise<unknown> => {
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` }
  })
  if (!res.ok) throw new Error(`Sheets API ${res.status}: ${await res.text()}`)
  return res.json()
}

const parseValues = (data: unknown): string[][] =>
  (data as { values?: string[][] })?.values ?? []

const col = (header: string[], name: string): number =>
  header.indexOf(name.trim().toLowerCase())

// ── Department (tab: "Department", columns: ID | Name | Status) ───────────

export const readDepartmentSheet = async (
  spreadsheetId: string,
  accessToken: string,
  sheetName = 'Department'
): Promise<DepartmentRow[]> => {
  const range = encodeURIComponent(`${sheetName}!A:C`)
  const rows = parseValues(await sheetsGet(`${SHEETS_BASE}/${spreadsheetId}/values/${range}`, accessToken))
  if (rows.length < 2) return []

  const header = rows[0].map(h => h.trim().toLowerCase())
  const id    = col(header, 'id')
  const name  = col(header, 'name')
  const st    = col(header, 'status')

  return rows
    .slice(1)
    .filter(row => row[id]?.trim())
    .map(row => ({
      department_id:   row[id].trim(),
      department_name: row[name]?.trim() ?? '',
      status:          row[st]?.trim().toLowerCase() ?? 'active'
    }))
}

// ── Designation (tab: "Designation", columns: ID | Name | Status) ─────────

export const readDesignationSheet = async (
  spreadsheetId: string,
  accessToken: string,
  sheetName = 'Designation'
): Promise<DesignationRow[]> => {
  const range = encodeURIComponent(`${sheetName}!A:C`)
  const rows = parseValues(await sheetsGet(`${SHEETS_BASE}/${spreadsheetId}/values/${range}`, accessToken))
  if (rows.length < 2) return []

  const header = rows[0].map(h => h.trim().toLowerCase())
  const id    = col(header, 'id')
  const name  = col(header, 'name')
  const st    = col(header, 'status')

  return rows
    .slice(1)
    .filter(row => row[id]?.trim())
    .map(row => ({
      designation_id:   row[id].trim(),
      designation_name: row[name]?.trim() ?? '',
      status:           row[st]?.trim().toLowerCase() ?? 'active'
    }))
}

// ── Employee (tab: "Employee", columns: ID | Name | email | password_hash |
//             department_id | designation_id | status)
//   Note: no "role" column in the sheet — defaults to 'staff' ──────────────

export const readEmployeeSheet = async (
  spreadsheetId: string,
  accessToken: string,
  sheetName = 'Employee'
): Promise<EmployeeRow[]> => {
  const range = encodeURIComponent(`${sheetName}!A:H`)
  const rows = parseValues(await sheetsGet(`${SHEETS_BASE}/${spreadsheetId}/values/${range}`, accessToken))
  if (rows.length < 2) return []

  const header = rows[0].map(h => h.trim().toLowerCase())
  const id    = col(header, 'id')
  const name  = col(header, 'name')
  const em    = col(header, 'email')
  const ph    = col(header, 'password_hash')
  const role  = col(header, 'role')
  const dep   = col(header, 'department_id')
  const des   = col(header, 'designation_id')
  const st    = col(header, 'status')

  return rows
    .slice(1)
    .filter(row => row[em]?.trim())
    .map(row => ({
      employee_id:    row[id]?.trim() ?? '',
      full_name:      row[name]?.trim() ?? '',
      email:          row[em].trim().toLowerCase(),
      password_hash:  row[ph]?.trim() ?? '',
      role:           role >= 0 ? (row[role]?.trim() ?? 'staff') : 'staff',
      department_id:  row[dep]?.trim() ?? '',
      designation_id: row[des]?.trim() ?? '',
      status:         row[st]?.trim().toLowerCase() ?? 'active'
    }))
    .filter(e => e.status === 'active')
}

// ── Apps (tab: "Apps", columns: ID | Name | CloneURL | CommitHash | Status) ──

export interface AppRow {
  app_id: string
  name: string
  clone_url: string
  commit_hash: string
  status: string
}

export interface AppUserRow {
  employee_id: string
  app_id: string
  status: string
}

export interface AppTeamRow {
  app_id: string
  team_id: string
  status: string
}

export interface TeamRow {
  team_id: string
  team_name: string
  status: string
}

export interface EmployeeTeamRow {
  employee_id: string
  team_id: string
  status: string
}

// Resolve a column index by checking multiple candidate names (normalised to lowercase)
const colAny = (header: string[], ...candidates: string[]): number => {
  for (const c of candidates) {
    const idx = header.indexOf(c.trim().toLowerCase())
    if (idx >= 0) return idx
  }
  return -1
}

export const readAppsSheet = async (
  spreadsheetId: string,
  accessToken: string,
  sheetName = 'Apps'
): Promise<AppRow[]> => {
  const range = encodeURIComponent(`${sheetName}!A:G`)
  const rows = parseValues(await sheetsGet(`${SHEETS_BASE}/${spreadsheetId}/values/${range}`, accessToken))
  if (rows.length < 2) return []

  const header   = rows[0].map(h => h.trim().toLowerCase())
  const id       = colAny(header, 'id')
  const name     = colAny(header, 'name')
  // Accept "clone url", "clone_url", "cloneurl", "clone-url"
  const cloneUrl = colAny(header, 'clone url', 'clone_url', 'cloneurl', 'clone-url', 'repo', 'repo url', 'repo_url')
  // Accept "commit hash", "commit_hash", "commithash", "hash"
  const hash     = colAny(header, 'commit hash', 'commit_hash', 'commithash', 'hash', 'commit')
  const st       = colAny(header, 'status')

  return rows
    .slice(1)
    .filter(row => row[id]?.trim())
    .map(row => ({
      app_id:      row[id].trim(),
      name:        row[name]?.trim() ?? '',
      clone_url:   cloneUrl >= 0 ? (row[cloneUrl]?.trim() ?? '') : '',
      commit_hash: hash >= 0 ? (row[hash]?.trim() ?? '') : '',
      status:      row[st]?.trim().toLowerCase() ?? 'active'
    }))
}

export const readAppUsersSheet = async (
  spreadsheetId: string,
  accessToken: string,
  sheetName = 'AppUsers'
): Promise<AppUserRow[]> => {
  const range = encodeURIComponent(`${sheetName}!A:D`)
  const rows = parseValues(await sheetsGet(`${SHEETS_BASE}/${spreadsheetId}/values/${range}`, accessToken))
  if (rows.length < 2) return []

  const header   = rows[0].map(h => h.trim().toLowerCase())
  const empCol   = col(header, 'employee_id') >= 0 ? col(header, 'employee_id') : col(header, 'employeeid')
  const appCol   = col(header, 'app_id') >= 0 ? col(header, 'app_id') : col(header, 'appid')
  const stCol    = col(header, 'status')

  return rows
    .slice(1)
    .filter(row => row[empCol]?.trim() && row[appCol]?.trim())
    .map(row => ({
      employee_id: row[empCol].trim(),
      app_id:      row[appCol].trim(),
      status:      row[stCol]?.trim().toLowerCase() ?? 'active'
    }))
}

export const readAppTeamsSheet = async (
  spreadsheetId: string,
  accessToken: string,
  sheetName = 'AppTeams'
): Promise<AppTeamRow[]> => {
  const range = encodeURIComponent(`${sheetName}!A:D`)
  const rows = parseValues(await sheetsGet(`${SHEETS_BASE}/${spreadsheetId}/values/${range}`, accessToken))
  if (rows.length < 2) return []

  const header = rows[0].map(h => h.trim().toLowerCase())
  const appCol  = col(header, 'app_id') >= 0 ? col(header, 'app_id') : col(header, 'appid')
  const teamCol = col(header, 'team_id') >= 0 ? col(header, 'team_id') : col(header, 'teamid')
  const stCol   = col(header, 'status')

  return rows
    .slice(1)
    .filter(row => row[appCol]?.trim() && row[teamCol]?.trim())
    .map(row => ({
      app_id:  row[appCol].trim(),
      team_id: row[teamCol].trim(),
      status:  row[stCol]?.trim().toLowerCase() ?? 'active'
    }))
}

export const readTeamsSheet = async (
  spreadsheetId: string,
  accessToken: string,
  sheetName = 'Teams'
): Promise<TeamRow[]> => {
  const range = encodeURIComponent(`${sheetName}!A:C`)
  const rows = parseValues(await sheetsGet(`${SHEETS_BASE}/${spreadsheetId}/values/${range}`, accessToken))
  if (rows.length < 2) return []

  const header = rows[0].map(h => h.trim().toLowerCase())
  const id   = col(header, 'id')
  const name = col(header, 'name')
  const st   = col(header, 'status')

  return rows
    .slice(1)
    .filter(row => row[id]?.trim())
    .map(row => ({
      team_id:   row[id].trim(),
      team_name: row[name]?.trim() ?? '',
      status:    row[st]?.trim().toLowerCase() ?? 'active'
    }))
}

export const readEmployeeTeamsSheet = async (
  spreadsheetId: string,
  accessToken: string,
  sheetName = 'EmployeeTeams'
): Promise<EmployeeTeamRow[]> => {
  const range = encodeURIComponent(`${sheetName}!A:D`)
  const rows = parseValues(await sheetsGet(`${SHEETS_BASE}/${spreadsheetId}/values/${range}`, accessToken))
  if (rows.length < 2) return []

  const header  = rows[0].map(h => h.trim().toLowerCase())
  const empCol  = col(header, 'employee_id') >= 0 ? col(header, 'employee_id') : col(header, 'employeeid')
  const teamCol = col(header, 'team_id') >= 0 ? col(header, 'team_id') : col(header, 'teamid')
  const stCol   = col(header, 'status')

  return rows
    .slice(1)
    .filter(row => row[empCol]?.trim() && row[teamCol]?.trim())
    .map(row => ({
      employee_id: row[empCol].trim(),
      team_id:     row[teamCol].trim(),
      status:      row[stCol]?.trim().toLowerCase() ?? 'active'
    }))
}

// ── Update Password in Google Sheets ────────────────────────────────────────

const sheetsPut = async (url: string, accessToken: string, body: unknown): Promise<unknown> => {
  const res = await fetch(url, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  })
  if (!res.ok) throw new Error(`Sheets API PUT ${res.status}: ${await res.text()}`)
  return res.json()
}

export const updateEmployeePasswordInSheet = async (
  spreadsheetId: string,
  accessToken: string,
  email: string,
  newPasswordHash: string,
  sheetName = 'Employee'
): Promise<boolean> => {
  const range = encodeURIComponent(`${sheetName}!A:H`)
  const url = `${SHEETS_BASE}/${spreadsheetId}/values/${range}`
  const data = await sheetsGet(url, accessToken)
  const rows = parseValues(data)
  
  if (rows.length < 2) return false

  const header = rows[0].map(h => h.trim().toLowerCase())
  const emCol = col(header, 'email')
  const phCol = col(header, 'password_hash')

  if (emCol === -1 || phCol === -1) return false

  const targetEmail = email.trim().toLowerCase()
  // Find row index (0-indexed based on rows array, so +1 for Sheets 1-indexed row number)
  const rowIndex = rows.findIndex((row, idx) => idx > 0 && row[emCol]?.trim().toLowerCase() === targetEmail)
  
  if (rowIndex === -1) return false

  // Sheets row number is rowIndex + 1
  const sheetRowNumber = rowIndex + 1
  // Convert 0-indexed column number to letter (A, B, C...)
  // Assuming column is < 26 for simplicity since it's A:H
  const colLetter = String.fromCharCode(65 + phCol)
  const cellRange = `${sheetName}!${colLetter}${sheetRowNumber}`

  const updateUrl = `${SHEETS_BASE}/${spreadsheetId}/values/${encodeURIComponent(cellRange)}?valueInputOption=USER_ENTERED`
  
  await sheetsPut(updateUrl, accessToken, {
    range: cellRange,
    majorDimension: 'ROWS',
    values: [[newPasswordHash]]
  })

  return true
}
