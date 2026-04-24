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

const parseValues = (data: unknown): string[][] => {
  return (data as { values?: string[][] })?.values ?? []
}

const headerIndex = (header: string[], name: string): number =>
  header.indexOf(name.trim().toLowerCase())

export const readDepartmentSheet = async (
  spreadsheetId: string,
  accessToken: string,
  sheetName = 'Departments'
): Promise<DepartmentRow[]> => {
  const range = encodeURIComponent(`${sheetName}!A:C`)
  const rows = parseValues(await sheetsGet(`${SHEETS_BASE}/${spreadsheetId}/values/${range}`, accessToken))
  if (rows.length < 2) return []

  const header = rows[0].map((h) => h.trim().toLowerCase())
  const did = headerIndex(header, 'department_id')
  const dname = headerIndex(header, 'department_name')
  const st = headerIndex(header, 'status')

  return rows
    .slice(1)
    .filter((row) => row[did]?.trim())
    .map((row) => ({
      department_id: row[did].trim(),
      department_name: row[dname]?.trim() ?? '',
      status: row[st]?.trim().toLowerCase() ?? 'active'
    }))
}

export const readDesignationSheet = async (
  spreadsheetId: string,
  accessToken: string,
  sheetName = 'Designations'
): Promise<DesignationRow[]> => {
  const range = encodeURIComponent(`${sheetName}!A:C`)
  const rows = parseValues(await sheetsGet(`${SHEETS_BASE}/${spreadsheetId}/values/${range}`, accessToken))
  if (rows.length < 2) return []

  const header = rows[0].map((h) => h.trim().toLowerCase())
  const did = headerIndex(header, 'designation_id')
  const dname = headerIndex(header, 'designation_name')
  const st = headerIndex(header, 'status')

  return rows
    .slice(1)
    .filter((row) => row[did]?.trim())
    .map((row) => ({
      designation_id: row[did].trim(),
      designation_name: row[dname]?.trim() ?? '',
      status: row[st]?.trim().toLowerCase() ?? 'active'
    }))
}

export const readEmployeeSheet = async (
  spreadsheetId: string,
  accessToken: string,
  sheetName = 'Employees'
): Promise<EmployeeRow[]> => {
  const range = encodeURIComponent(`${sheetName}!A:H`)
  const rows = parseValues(await sheetsGet(`${SHEETS_BASE}/${spreadsheetId}/values/${range}`, accessToken))
  if (rows.length < 2) return []

  const header = rows[0].map((h) => h.trim().toLowerCase())
  const eid = headerIndex(header, 'employee_id')
  const fname = headerIndex(header, 'full_name')
  const em = headerIndex(header, 'email')
  const ph = headerIndex(header, 'password_hash')
  const ro = headerIndex(header, 'role')
  const dep = headerIndex(header, 'department_id')
  const des = headerIndex(header, 'designation_id')
  const st = headerIndex(header, 'status')

  return rows
    .slice(1)
    .filter((row) => row[em]?.trim())
    .map((row) => ({
      employee_id: row[eid]?.trim() ?? '',
      full_name: row[fname]?.trim() ?? '',
      email: row[em].trim().toLowerCase(),
      password_hash: row[ph]?.trim() ?? '',
      role: row[ro]?.trim() ?? 'staff',
      department_id: row[dep]?.trim() ?? '',
      designation_id: row[des]?.trim() ?? '',
      status: row[st]?.trim().toLowerCase() ?? 'active'
    }))
    .filter((e) => e.status === 'active')
}
