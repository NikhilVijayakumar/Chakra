import { sqliteTable, text, integer, primaryKey } from 'drizzle-orm/sqlite-core'

// Helper for common sync fields
const syncFields = {
  sync: integer('sync'),
  isDirty: integer('is_dirty', { mode: 'boolean' }).default(false).notNull(),
  isDeleted: integer('is_deleted', { mode: 'boolean' }).default(false).notNull()
}

export const apps = sqliteTable('apps', {
  id: text('id').primaryKey(),
  name: text('name'),
  cloneUrl: text('clone_url'),
  commitHash: text('commit_hash'),
  status: text('status'),
  ...syncFields
})

export const appUsers = sqliteTable('app_users', {
  employeeId: text('employee_id'),
  appId: text('app_id'),
  status: text('status'),
  ...syncFields
}, (table) => {
  return {
    pk: primaryKey({ columns: [table.employeeId, table.appId] })
  }
})

export const appTeams = sqliteTable('app_teams', {
  appId: text('app_id'),
  teamId: text('team_id'),
  status: text('status'),
  ...syncFields
}, (table) => {
  return {
    pk: primaryKey({ columns: [table.appId, table.teamId] })
  }
})

export const attendanceKeys = sqliteTable('attendance_keys', {
  shortKey: text('short_key').primaryKey(),
  fullDescription: text('full_description'),
  ...syncFields
})

export const configs = sqliteTable('configs', {
  id: text('id').primaryKey(),
  key: text('key'),
  value: text('value'),
  status: text('status'),
  ...syncFields
})

export const departments = sqliteTable('departments', {
  id: text('id').primaryKey(),
  name: text('name'),
  status: text('status'),
  ...syncFields
})

export const designations = sqliteTable('designations', {
  id: text('id').primaryKey(),
  name: text('name'),
  status: text('status'),
  ...syncFields
})

export const employeeTeams = sqliteTable('employee_teams', {
  employeeId: text('employee_id'),
  teamId: text('team_id'),
  status: text('status'),
  ...syncFields
}, (table) => {
  return {
    pk: primaryKey({ columns: [table.employeeId, table.teamId] })
  }
})

export const employees = sqliteTable('employees', {
  id: text('id').primaryKey(),
  name: text('name'),
  email: text('email'),
  passwordHash: text('password_hash'),
  otpHash: text('otp_hash'),
  otpExpiry: integer('otp_expiry'),
  role: text('role'),
  departmentId: text('department_id'),
  designationId: text('designation_id'),
  status: text('status'),
  // `synced_at` was used locally, replaced by `sync`
  ...syncFields
})

export const holidays = sqliteTable('holidays', {
  date: text('date').primaryKey(),
  holidayName: text('holiday_name'),
  ...syncFields
})

export const leaves = sqliteTable('leaves', {
  leaveType: text('leave_type').primaryKey(),
  count: integer('count'),
  carryForward: integer('carry_forward'),
  maxForward: integer('max_forward'),
  ...syncFields
})

export const teams = sqliteTable('teams', {
  id: text('id').primaryKey(),
  name: text('name'),
  status: text('status'),
  ...syncFields
})

export const googleAuth = sqliteTable('google_auth', {
  key: text('key').primaryKey(),
  value: text('value').notNull()
})

export const installedApps = sqliteTable('installed_apps', {
  appId: text('app_id').primaryKey(),
  installedAt: integer('installed_at'),
  installPath: text('install_path')
})
