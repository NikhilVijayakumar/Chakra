import { existsSync, readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'

export interface TabNames {
  chakraConfig: string
  department: string
  designation: string
  employee: string
  attendanceKey: string
  holiday: string
  leave: string
  config: string
  app: string
  appUser: string
  appTeam: string
  team: string
  employeeTeam: string
}

const DEFAULT_TABS: TabNames = {
  chakraConfig:  'ChakraConfig',
  department:    'Department',
  designation:   'Designation',
  employee:      'Employee',
  attendanceKey: 'AttendanceKey',
  holiday:       'Holiday',
  leave:         'Leave',
  config:        'Config',
  app:           'App',
  appUser:       'AppUser',
  appTeam:       'AppTeam',
  team:          'Team',
  employeeTeam:  'EmployeeTeam'
}

interface RuntimeConfig {
  serviceAccountKeyPath?: string
  configSheetId?: string
  appCatalogSheetId?: string
  tabs?: Partial<TabNames>
}

let cached: RuntimeConfig | null = null

const resolveRuntimeConfigPath = (): string | null => {
  const candidates = [
    join(process.cwd(), 'config', 'chakra-runtime.json'),
    join(process.resourcesPath ?? '', 'config', 'chakra-runtime.json')
  ]
  for (const candidate of candidates) {
    if (existsSync(candidate)) return candidate
  }
  return null
}

export const readRuntimeConfig = (): RuntimeConfig => {
  if (cached) return cached
  const path = resolveRuntimeConfigPath()
  if (!path) {
    cached = {}
    return cached
  }
  try {
    const raw = JSON.parse(readFileSync(path, 'utf-8')) as RuntimeConfig
    cached = {
      serviceAccountKeyPath: raw.serviceAccountKeyPath?.trim() || undefined,
      configSheetId: raw.configSheetId?.trim() || undefined,
      appCatalogSheetId: raw.appCatalogSheetId?.trim() || undefined,
      tabs: raw.tabs && typeof raw.tabs === 'object' ? raw.tabs : undefined
    }
    return cached
  } catch (err) {
    console.warn('[Chakra] Could not read chakra-runtime.json:', err)
    cached = {}
    return cached
  }
}

// The main Google Spreadsheet that holds all Chakra data tabs (Config, Department, Employee, etc.)
export const getBootstrapConfigSheetId = (): string | null =>
  readRuntimeConfig().configSheetId ?? null

// App catalog spreadsheet — defaults to the main sheet when not separately configured.
export const getAppCatalogSheetId = (): string | null => {
  const cfg = readRuntimeConfig()
  return cfg.appCatalogSheetId ?? cfg.configSheetId ?? null
}

// Returns the absolute path to the service account JSON key file,
// resolved relative to cwd when a relative path is given.
export const getServiceAccountKeyPath = (): string | null => {
  const p = readRuntimeConfig().serviceAccountKeyPath
  if (!p) return null
  return resolve(process.cwd(), p)
}

// Returns resolved tab names — config overrides take precedence, then defaults.
export const getTabNames = (): TabNames => ({
  ...DEFAULT_TABS,
  ...readRuntimeConfig().tabs
})

export const resetRuntimeConfigCache = (): void => {
  cached = null
}
