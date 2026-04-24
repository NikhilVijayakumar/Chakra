import { readDepartmentSheet, readDesignationSheet, readEmployeeSheet } from './googleSheetsService'
import { saveDepartments, saveDesignations, saveEmployees } from './employeeStoreService'

export interface HrSyncResult {
  success: boolean
  departmentsLoaded: number
  designationsLoaded: number
  employeesLoaded: number
  errors: string[]
}

export const syncHrFromSheets = async (
  accessToken: string,
  spreadsheetId: string
): Promise<HrSyncResult> => {
  const errors: string[] = []
  let departmentsLoaded = 0
  let designationsLoaded = 0
  let employeesLoaded = 0

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

  return {
    success: errors.length === 0,
    departmentsLoaded,
    designationsLoaded,
    employeesLoaded,
    errors
  }
}
