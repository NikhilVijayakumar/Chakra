import bcrypt from 'bcryptjs'
import { eq, sql } from 'drizzle-orm'
import { getDb, resetDbInitialization } from '../db/init'
import { departments, designations, employees, googleAuth } from '../db/schema'
import type { DepartmentRow, DesignationRow, EmployeeRow } from './googleSheetsService'

export const setSqliteRoot = (root: string): void => {
  resetDbInitialization()
}

// ── Google Sheets sheet ID storage ────────────────────────────────────────

export const getStoredSheetId = async (): Promise<string | null> => {
  const db = getDb()
  const result = db.select({ value: googleAuth.value }).from(googleAuth).where(eq(googleAuth.key, 'employee_sheet_id')).get()
  return result?.value ?? null
}

export const saveEmployeeSheetId = async (sheetId: string): Promise<void> => {
  const db = getDb()
  db.insert(googleAuth)
    .values({ key: 'employee_sheet_id', value: sheetId })
    .onConflictDoUpdate({
      target: googleAuth.key,
      set: { value: sheetId }
    })
    .run()
}

// ── Employee sync & login ──────────────────────────────────────────────────

export const saveDepartments = async (deptRows: DepartmentRow[]): Promise<void> => {
  const db = getDb()
  // First, we can clear the table or just upsert. 
  // Let's hard-delete everything that was there or we can upsert.
  // The original code did: `db.run('DELETE FROM departments')` then inserts.
  db.delete(departments).run()
  
  if (deptRows.length === 0) return

  db.insert(departments)
    .values(
      deptRows.map(d => ({
        id: d.department_id,
        name: d.department_name,
        status: d.status,
        sync: Math.floor(Date.now() / 1000), // Setting sync timestamp
        isDirty: false,
        isDeleted: false
      }))
    )
    .run()
  
  console.info(`[Chakra] Employee store: ${deptRows.length} departments saved to SQLite`)
}

export const saveDesignations = async (desigRows: DesignationRow[]): Promise<void> => {
  const db = getDb()
  db.delete(designations).run()
  
  if (desigRows.length === 0) return

  db.insert(designations)
    .values(
      desigRows.map(d => ({
        id: d.designation_id,
        name: d.designation_name,
        status: d.status,
        sync: Math.floor(Date.now() / 1000), // Setting sync timestamp
        isDirty: false,
        isDeleted: false
      }))
    )
    .run()

  console.info(`[Chakra] Employee store: ${desigRows.length} designations saved to SQLite`)
}

export const saveEmployees = async (empRows: EmployeeRow[]): Promise<void> => {
  const db = getDb()
  const nowUnix = Math.floor(Date.now() / 1000)

  for (const e of empRows) {
    db.insert(employees)
      .values({
        id: e.employee_id,
        name: e.full_name,
        email: e.email,
        passwordHash: e.password_hash,
        departmentId: e.department_id,
        designationId: e.designation_id,
        status: e.status,
        sync: nowUnix,
        isDirty: false,
        isDeleted: false
      })
      .onConflictDoUpdate({
        target: employees.id,
        set: {
          name: e.full_name,
          email: e.email,
          departmentId: e.department_id,
          designationId: e.designation_id,
          status: e.status,
          sync: nowUnix,
          // Keep local hash if a local reset is pending; otherwise accept the Sheets value
          passwordHash: sql`CASE WHEN ${employees.isDirty} = 1 THEN ${employees.passwordHash} ELSE ${e.password_hash} END`
        }
      })
      .run()
  }

  console.info(`[Chakra] Employee store: ${empRows.length} employees upserted to SQLite`)
}

export const checkActiveEmployee = async (email: string): Promise<boolean> => {
  const db = getDb()
  const targetEmail = email.trim().toLowerCase()
  
  const result = db.select({ status: employees.status })
    .from(employees)
    .where(eq(employees.email, targetEmail))
    .get()
    
  return result?.status === 'active'
}

export const saveEmployeeOtp = async (email: string, otpHash: string, otpExpiry: number): Promise<boolean> => {
  const db = getDb()
  db.update(employees)
    .set({ otpHash, otpExpiry, isDirty: true }) 
    .where(eq(employees.email, email.trim().toLowerCase()))
    .run()
    
  return true
}

export const verifyEmployeeOtp = async (email: string, otp: string): Promise<{ success: boolean, reason?: string }> => {
  const db = getDb()
  const targetEmail = email.trim().toLowerCase()
  
  const emp = db.select({ otpHash: employees.otpHash, otpExpiry: employees.otpExpiry })
    .from(employees)
    .where(eq(employees.email, targetEmail))
    .get()
    
  if (!emp) return { success: false, reason: 'not_found' }
  if (!emp.otpHash || !emp.otpExpiry) return { success: false, reason: 'no_otp_requested' }
  if (Date.now() > emp.otpExpiry) return { success: false, reason: 'otp_expired' }
  
  const matches = await bcrypt.compare(otp, emp.otpHash)
  if (!matches) return { success: false, reason: 'invalid_otp' }
  
  db.update(employees)
    .set({ otpHash: null, otpExpiry: null, isDirty: true })
    .where(eq(employees.email, targetEmail))
    .run()
    
  return { success: true }
}

export const updateEmployeePassword = async (email: string, newPasswordHash: string): Promise<boolean> => {
  const db = getDb()
  const normalizedEmail = email.trim().toLowerCase()
  
  const result = db.update(employees)
    .set({ passwordHash: newPasswordHash, isDirty: true })
    .where(eq(employees.email, normalizedEmail))
    .run()
    
  console.info('[EmployeeStore] Password updated in SQLite for:', normalizedEmail)
  return result.changes > 0
}

export const hasEmployees = async (): Promise<boolean> => {
  try {
    const db = getDb()
    const result = db.select({ id: employees.id }).from(employees).limit(1).get()
    return !!result
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
    role: string // Oh, wait, `role` is in original schema.
    department_id: string
    designation_id: string
  }
  sessionToken?: string
}

export const loginEmployee = async (email: string, password: string): Promise<EmployeeLoginResult> => {
  const db = getDb()
  const targetEmail = email.trim().toLowerCase()
  
  const emp = db.select().from(employees).where(eq(employees.email, targetEmail)).get()
  
  if (!emp) {
    return { success: false, reason: 'not_found' }
  }
  
  if (emp.status !== 'active') {
    return { success: false, reason: 'account_inactive' }
  }
  
  if (!emp.passwordHash) return { success: false, reason: 'invalid_password' }
  
  const matches = await bcrypt.compare(password, emp.passwordHash)
  if (!matches) return { success: false, reason: 'invalid_password' }
  
  const sessionToken = `prana_session_${Math.random().toString(36).slice(2)}${Date.now()}`
  
  return {
    success: true,
    employee: {
      employee_id: emp.id,
      full_name: emp.name ?? '',
      email: emp.email ?? '',
      role: emp.role ?? 'staff',
      department_id: emp.departmentId ?? '',
      designation_id: emp.designationId ?? ''
    },
    sessionToken
  }
}

export const employeeStoreService = {
  setSqliteRoot,
  getStoredSheetId,
  saveEmployeeSheetId,
  saveDepartments,
  saveDesignations,
  saveEmployees,
  hasEmployees,
  loginEmployee,
  checkActiveEmployee,
  saveEmployeeOtp,
  verifyEmployeeOtp,
  updateEmployeePassword
}
