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
