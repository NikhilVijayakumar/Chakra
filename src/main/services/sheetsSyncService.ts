import {
  readDepartmentSheet,
  readDesignationSheet,
  readEmployeeSheet,
  updateEmployeePasswordInSheet,
  readAppsSheet,
  readAppUsersSheet,
  readAppTeamsSheet,
  readTeamsSheet,
  readEmployeeTeamsSheet,
  readAttendanceKeySheet,
  readHolidaySheet,
  readLeaveSheet
} from './googleSheetsService'
import {
  saveDepartments,
  saveDesignations,
  saveEmployees,
  saveAttendanceKeys,
  saveHolidays,
  saveLeaves
} from './employeeStoreService'
import { saveApps, saveAppUsers, saveAppTeams, saveTeams, saveEmployeeTeams } from './appInstallService'
import { getServiceAccountToken } from './googleServiceAccountService'
import { getDb } from '../db/init'
import { employees } from '../db/schema'
import { eq } from 'drizzle-orm'

export interface HrSyncResult {
  success: boolean
  departmentsLoaded: number
  designationsLoaded: number
  employeesLoaded: number
  attendanceKeysLoaded: number
  holidaysLoaded: number
  leavesLoaded: number
  errors: string[]
}

export const syncHrFromSheets = async (spreadsheetId: string): Promise<HrSyncResult> => {
  const accessToken = await getServiceAccountToken()
  const errors: string[] = []
  let departmentsLoaded = 0
  let designationsLoaded = 0
  let employeesLoaded = 0
  let attendanceKeysLoaded = 0
  let holidaysLoaded = 0
  let leavesLoaded = 0

  // First, push local dirty passwords back to the sheet
  try {
    const db = getDb()
    const dirtyEmployees = db.select({ email: employees.email, passwordHash: employees.passwordHash })
      .from(employees)
      .where(eq(employees.isDirty, true))
      .all()
      
    for (const emp of dirtyEmployees) {
      if (emp.email && emp.passwordHash) {
        await updateEmployeePasswordInSheet(spreadsheetId, accessToken, emp.email, emp.passwordHash)
        // Mark as clean after pushing
        db.update(employees)
          .set({ isDirty: false })
          .where(eq(employees.email, emp.email))
          .run()
        console.info(`[Chakra] Sheets sync: Pushed updated password for ${emp.email}`)
      }
    }
  } catch (err) {
    errors.push(`Push dirty passwords: ${err instanceof Error ? err.message : String(err)}`)
    console.warn('[Chakra] Sheets sync: push passwords error:', err)
  }

  try {
    const departments = await readDepartmentSheet(spreadsheetId, accessToken)
    departmentsLoaded = departments.length
    await saveDepartments(departments)
    console.info(`[Chakra] Sheets sync: saved ${departmentsLoaded} departments`)
  } catch (err) {
    errors.push(`Departments sheet: ${err instanceof Error ? err.message : String(err)}`)
    console.warn('[Chakra] Sheets sync: departments error:', err)
  }

  try {
    const designations = await readDesignationSheet(spreadsheetId, accessToken)
    designationsLoaded = designations.length
    await saveDesignations(designations)
    console.info(`[Chakra] Sheets sync: saved ${designationsLoaded} designations`)
  } catch (err) {
    errors.push(`Designations sheet: ${err instanceof Error ? err.message : String(err)}`)
    console.warn('[Chakra] Sheets sync: designations error:', err)
  }

  try {
    const employees = await readEmployeeSheet(spreadsheetId, accessToken)
    employeesLoaded = employees.length
    await saveEmployees(employees)
    console.info(`[Chakra] Sheets sync: saved ${employeesLoaded} active employees`)
  } catch (err) {
    errors.push(`Employees sheet: ${err instanceof Error ? err.message : String(err)}`)
    console.warn('[Chakra] Sheets sync: employees error:', err)
  }

  try {
    const rows = await readAttendanceKeySheet(spreadsheetId, accessToken)
    attendanceKeysLoaded = rows.length
    await saveAttendanceKeys(rows)
    console.info(`[Chakra] Sheets sync: saved ${attendanceKeysLoaded} attendance keys`)
  } catch (err) {
    errors.push(`AttendanceKey sheet: ${err instanceof Error ? err.message : String(err)}`)
    console.warn('[Chakra] Sheets sync: attendance-keys error:', err)
  }

  try {
    const rows = await readHolidaySheet(spreadsheetId, accessToken)
    holidaysLoaded = rows.length
    await saveHolidays(rows)
    console.info(`[Chakra] Sheets sync: saved ${holidaysLoaded} holidays`)
  } catch (err) {
    errors.push(`Holiday sheet: ${err instanceof Error ? err.message : String(err)}`)
    console.warn('[Chakra] Sheets sync: holidays error:', err)
  }

  try {
    const rows = await readLeaveSheet(spreadsheetId, accessToken)
    leavesLoaded = rows.length
    await saveLeaves(rows)
    console.info(`[Chakra] Sheets sync: saved ${leavesLoaded} leave types`)
  } catch (err) {
    errors.push(`Leave sheet: ${err instanceof Error ? err.message : String(err)}`)
    console.warn('[Chakra] Sheets sync: leaves error:', err)
  }

  // Post-sync cleanup: remove any local rows marked as isDeleted=1 (if any were created)
  try {
    const db = getDb()
    db.delete(employees).where(eq(employees.isDeleted, true)).run()
    // Other tables could be cleaned up here too if they supported soft deletion in the app.
  } catch (err) {
    console.warn('[Chakra] Sheets sync: cleanup error:', err)
  }

  return {
    success: errors.length === 0,
    departmentsLoaded,
    designationsLoaded,
    employeesLoaded,
    attendanceKeysLoaded,
    holidaysLoaded,
    leavesLoaded,
    errors
  }
}

export interface AppSyncResult {
  success: boolean
  appsLoaded: number
  appUsersLoaded: number
  appTeamsLoaded: number
  teamsLoaded: number
  employeeTeamsLoaded: number
  errors: string[]
}

export const syncAppsFromSheets = async (spreadsheetId: string): Promise<AppSyncResult> => {
  const accessToken = await getServiceAccountToken()
  const errors: string[] = []
  let appsLoaded = 0
  let appUsersLoaded = 0
  let appTeamsLoaded = 0
  let teamsLoaded = 0
  let employeeTeamsLoaded = 0

  try {
    const rows = await readAppsSheet(spreadsheetId, accessToken)
    appsLoaded = rows.length
    await saveApps(rows)
  } catch (err) {
    errors.push(`Apps sheet: ${err instanceof Error ? err.message : String(err)}`)
    console.warn('[Chakra] App sync: apps error:', err)
  }

  try {
    const rows = await readAppUsersSheet(spreadsheetId, accessToken)
    appUsersLoaded = rows.length
    await saveAppUsers(rows)
  } catch (err) {
    errors.push(`AppUsers sheet: ${err instanceof Error ? err.message : String(err)}`)
    console.warn('[Chakra] App sync: app-users error:', err)
  }

  try {
    const rows = await readAppTeamsSheet(spreadsheetId, accessToken)
    appTeamsLoaded = rows.length
    await saveAppTeams(rows)
  } catch (err) {
    errors.push(`AppTeams sheet: ${err instanceof Error ? err.message : String(err)}`)
    console.warn('[Chakra] App sync: app-teams error:', err)
  }

  try {
    const rows = await readTeamsSheet(spreadsheetId, accessToken)
    teamsLoaded = rows.length
    await saveTeams(rows)
  } catch (err) {
    errors.push(`Teams sheet: ${err instanceof Error ? err.message : String(err)}`)
    console.warn('[Chakra] App sync: teams error:', err)
  }

  try {
    const rows = await readEmployeeTeamsSheet(spreadsheetId, accessToken)
    employeeTeamsLoaded = rows.length
    await saveEmployeeTeams(rows)
  } catch (err) {
    errors.push(`EmployeeTeams sheet: ${err instanceof Error ? err.message : String(err)}`)
    console.warn('[Chakra] App sync: employee-teams error:', err)
  }

  return {
    success: errors.length === 0,
    appsLoaded,
    appUsersLoaded,
    appTeamsLoaded,
    teamsLoaded,
    employeeTeamsLoaded,
    errors
  }
}
