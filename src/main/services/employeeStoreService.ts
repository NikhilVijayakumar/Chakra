import { existsSync } from 'node:fs'
import { readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import initSqlJs, { type Database, type SqlJsStatic } from 'sql.js'
import bcrypt from 'bcryptjs'
import type { DepartmentRow, DesignationRow, EmployeeRow } from './googleSheetsService'

const DB_FILE_NAME = 'chakra.sqlite'

let sqlRuntimePromise: Promise<SqlJsStatic> | null = null
let dbPromise: Promise<Database> | null = null
let writeQueue: Promise<void> = Promise.resolve()

const resolveSqlJsAsset = (fileName: string): string => {
  const candidates = [
    join(process.cwd(), 'node_modules', 'sql.js', 'dist', fileName),
    join(process.resourcesPath ?? '', 'app.asar.unpacked', 'node_modules', 'sql.js', 'dist', fileName),
    join(process.resourcesPath ?? '', 'node_modules', 'sql.js', 'dist', fileName)
  ]
  for (const c of candidates) {
    if (existsSync(c)) return c
  }
  return fileName
}

const getSqlRuntime = async (): Promise<SqlJsStatic> => {
  if (!sqlRuntimePromise) {
    sqlRuntimePromise = initSqlJs({ locateFile: (f) => resolveSqlJsAsset(f) })
  }
  return sqlRuntimePromise
}

const getDbPath = (): string => {
  // Import inline to pick up the current root (may be overridden for virtual drive)
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { getSqliteRoot } = require('prana/main/services/governanceRepoService') as {
    getSqliteRoot: () => string
  }
  return join(getSqliteRoot(), DB_FILE_NAME)
}

const persistDb = async (db: Database): Promise<void> => {
  const { mkdirSafe } = await import('prana/main/services/governanceRepoService')
  const { getSqliteRoot } = await import('prana/main/services/governanceRepoService')
  await mkdirSafe(getSqliteRoot())
  await writeFile(getDbPath(), Buffer.from(db.export()))
}

const queueWrite = async (op: () => Promise<void>): Promise<void> => {
  writeQueue = writeQueue.then(op, op)
  await writeQueue
}

const initializeDb = async (): Promise<Database> => {
  const SQL = await getSqlRuntime()
  const { mkdirSafe } = await import('prana/main/services/governanceRepoService')
  const { getSqliteRoot } = await import('prana/main/services/governanceRepoService')
  await mkdirSafe(getSqliteRoot())
  const dbPath = getDbPath()
  const db = existsSync(dbPath)
    ? new SQL.Database(new Uint8Array(await readFile(dbPath)))
    : new SQL.Database()

  db.run(`
    CREATE TABLE IF NOT EXISTS departments (
      department_id   TEXT PRIMARY KEY,
      department_name TEXT,
      status          TEXT
    )
  `)

  db.run(`
    CREATE TABLE IF NOT EXISTS designations (
      designation_id   TEXT PRIMARY KEY,
      designation_name TEXT,
      status           TEXT
    )
  `)

  db.run(`
    CREATE TABLE IF NOT EXISTS employees (
      employee_id    TEXT,
      full_name      TEXT,
      email          TEXT PRIMARY KEY,
      password_hash  TEXT,
      role           TEXT,
      department_id  TEXT,
      designation_id TEXT,
      status         TEXT,
      synced_at      TEXT
    )
  `)

  db.run(`
    CREATE TABLE IF NOT EXISTS google_auth (
      key   TEXT PRIMARY KEY,
      value TEXT NOT NULL
    )
  `)

  await persistDb(db)
  return db
}

const getDb = async (): Promise<Database> => {
  if (!dbPromise) dbPromise = initializeDb()
  return dbPromise
}

// ── Google OAuth token storage ─────────────────────────────────────────────

const authGet = async (key: string): Promise<string | null> => {
  const db = await getDb()
  const stmt = db.prepare('SELECT value FROM google_auth WHERE key = ?')
  stmt.bind([key])
  if (!stmt.step()) { stmt.free(); return null }
  const row = stmt.getAsObject() as { value?: string }
  stmt.free()
  return row.value ?? null
}

const authSet = async (key: string, value: string): Promise<void> => {
  await queueWrite(async () => {
    const db = await getDb()
    db.run(
      'INSERT INTO google_auth (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value',
      [key, value]
    )
    await persistDb(db)
  })
}

const authDel = async (key: string): Promise<void> => {
  await queueWrite(async () => {
    const db = await getDb()
    db.run('DELETE FROM google_auth WHERE key = ?', [key])
    await persistDb(db)
  })
}

export interface StoredGoogleAuth {
  access_token: string
  refresh_token: string
  expiry_date: number
  employee_sheet_id: string
}

export const loadStoredGoogleAuth = async (): Promise<Partial<StoredGoogleAuth>> => {
  const [at, rt, ed, sid] = await Promise.all([
    authGet('access_token'),
    authGet('refresh_token'),
    authGet('expiry_date'),
    authGet('employee_sheet_id')
  ])
  const result: Partial<StoredGoogleAuth> = {}
  if (at) result.access_token = at
  if (rt) result.refresh_token = rt
  if (ed) result.expiry_date = parseInt(ed)
  if (sid) result.employee_sheet_id = sid
  return result
}

export const saveGoogleAuthTokens = async (tokens: {
  access_token: string
  refresh_token: string
  expiry_date: number
}): Promise<void> => {
  await Promise.all([
    authSet('access_token', tokens.access_token),
    authSet('refresh_token', tokens.refresh_token),
    authSet('expiry_date', String(tokens.expiry_date))
  ])
}

export const clearGoogleAuthTokens = async (): Promise<void> => {
  await Promise.all([
    authDel('access_token'),
    authDel('refresh_token'),
    authDel('expiry_date')
  ])
}

export const saveEmployeeSheetId = async (sheetId: string): Promise<void> => {
  await authSet('employee_sheet_id', sheetId)
}

// ── Employee sync & login ──────────────────────────────────────────────────

export const saveDepartments = async (departments: DepartmentRow[]): Promise<void> => {
  await queueWrite(async () => {
    const db = await getDb()
    db.run('DELETE FROM departments')
    const stmt = db.prepare(
      'INSERT INTO departments (department_id, department_name, status) VALUES (?,?,?)'
    )
    for (const d of departments) {
      stmt.run([d.department_id, d.department_name, d.status])
    }
    stmt.free()
    await persistDb(db)
    console.info(`[Chakra] Employee store: ${departments.length} departments saved to SQLite`)
  })
}

export const saveDesignations = async (designations: DesignationRow[]): Promise<void> => {
  await queueWrite(async () => {
    const db = await getDb()
    db.run('DELETE FROM designations')
    const stmt = db.prepare(
      'INSERT INTO designations (designation_id, designation_name, status) VALUES (?,?,?)'
    )
    for (const d of designations) {
      stmt.run([d.designation_id, d.designation_name, d.status])
    }
    stmt.free()
    await persistDb(db)
    console.info(`[Chakra] Employee store: ${designations.length} designations saved to SQLite`)
  })
}

export const saveEmployees = async (employees: EmployeeRow[]): Promise<void> => {
  await queueWrite(async () => {
    const db = await getDb()
    const now = new Date().toISOString()
    db.run('DELETE FROM employees')
    const stmt = db.prepare(
      'INSERT INTO employees (employee_id, full_name, email, password_hash, role, department_id, designation_id, status, synced_at) VALUES (?,?,?,?,?,?,?,?,?)'
    )
    for (const e of employees) {
      stmt.run([e.employee_id, e.full_name, e.email, e.password_hash, e.role, e.department_id, e.designation_id, e.status, now])
    }
    stmt.free()
    await persistDb(db)
    console.info(`[Chakra] Employee store: ${employees.length} employees saved to SQLite`)
  })
}

export const hasEmployees = async (): Promise<boolean> => {
  try {
    const db = await getDb()
    const result = db.exec('SELECT COUNT(*) FROM employees')
    const count = (result[0]?.values?.[0]?.[0] as number) ?? 0
    return count > 0
  } catch {
    return false
  }
}

export interface EmployeeLoginResult {
  success: boolean
  reason?: 'not_found' | 'invalid_password' | 'account_inactive' | 'no_employees'
  employee?: {
    employee_id: string
    full_name: string
    email: string
    role: string
    department_id: string
    designation_id: string
  }
  sessionToken?: string
}

export const loginEmployee = async (email: string, password: string): Promise<EmployeeLoginResult> => {
  const db = await getDb()
  const result = db.exec(
    'SELECT employee_id, full_name, email, password_hash, role, department, status FROM employees WHERE email = ?',
    [email.trim().toLowerCase()]
  )

  if (!result.length || !result[0].values.length) {
    return { success: false, reason: 'not_found' }
  }

  const cols = result[0].columns
  const row = result[0].values[0]
  const get = (col: string): string => (row[cols.indexOf(col)] as string) ?? ''

  if (get('status') !== 'active') {
    return { success: false, reason: 'account_inactive' }
  }

  const hash = get('password_hash')
  if (!hash) return { success: false, reason: 'invalid_password' }

  const matches = await bcrypt.compare(password, hash)
  if (!matches) return { success: false, reason: 'invalid_password' }

  const sessionToken = `prana_session_${Math.random().toString(36).slice(2)}${Date.now()}`

  return {
    success: true,
    employee: {
      employee_id: get('employee_id'),
      full_name: get('full_name'),
      email: get('email'),
      role: get('role'),
      department_id: get('department_id'),
      designation_id: get('designation_id')
    },
    sessionToken
  }
}

export const employeeStoreService = {
  loadStoredGoogleAuth,
  saveGoogleAuthTokens,
  clearGoogleAuthTokens,
  saveEmployeeSheetId,
  saveDepartments,
  saveDesignations,
  saveEmployees,
  hasEmployees,
  loginEmployee
}
