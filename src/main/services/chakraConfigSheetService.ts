// ChakraConfig sheet service — reads the ChakraConfig master sheet tab (key/value layout).
// Config keys Chakra expects:
//   company_name          — display name for the organisation
//   employee_sheet_id     — spreadsheet ID for HR + runtime config data
//   app_catalog_sheet_id  — spreadsheet ID for the app catalog

import { getServiceAccountToken } from './googleServiceAccountService'
import { getTabNames } from './bootstrapConfigService'
import { eq } from 'drizzle-orm'
import { getDb } from '../db/init'
import { googleAuth } from '../db/schema'

const SHEETS_BASE = 'https://sheets.googleapis.com/v4/spreadsheets'

export interface ChakraConfig {
  companyName?: string
  employeeSheetId?: string
  appCatalogSheetId?: string
  raw: Record<string, string>
}

const sheetsGet = async (url: string, accessToken: string): Promise<unknown> => {
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` }
  })
  if (!res.ok) throw new Error(`Sheets API ${res.status}: ${await res.text()}`)
  return res.json()
}

export const readChakraConfigSheet = async (
  spreadsheetId: string,
  accessToken: string,
  sheetName = 'ChakraConfig'
): Promise<Record<string, string>> => {
  const range = encodeURIComponent(`${sheetName}!A:B`)
  const data = await sheetsGet(`${SHEETS_BASE}/${spreadsheetId}/values/${range}`, accessToken)
  const rows = ((data as { values?: string[][] })?.values ?? [])

  const config: Record<string, string> = {}
  for (const row of rows) {
    const key = row[0]?.trim()
    const value = row[1]?.trim()
    if (key && value) {
      config[key.toLowerCase()] = value
    }
  }
  return config
}

// ── Persistence helpers (reuse google_auth KV table) ──────────────────────────

const CONFIG_KEY_PREFIX = 'chakra_config:'

export const saveChakraConfigValue = (key: string, value: string): void => {
  const db = getDb()
  const storeKey = `${CONFIG_KEY_PREFIX}${key}`
  db.insert(googleAuth)
    .values({ key: storeKey, value })
    .onConflictDoUpdate({ target: googleAuth.key, set: { value } })
    .run()
}

export const getChakraConfigValue = (key: string): string | null => {
  const db = getDb()
  const storeKey = `${CONFIG_KEY_PREFIX}${key}`
  return db.select({ value: googleAuth.value }).from(googleAuth).where(eq(googleAuth.key, storeKey)).get()?.value ?? null
}

// ── Sync Chakra config from Google Sheets ─────────────────────────────────────

export interface ChakraConfigSyncResult {
  success: boolean
  config: ChakraConfig
  errors: string[]
}

export const syncChakraConfig = async (configSpreadsheetId: string): Promise<ChakraConfigSyncResult> => {
  const errors: string[] = []
  let raw: Record<string, string> = {}

  try {
    const accessToken = await getServiceAccountToken()
    raw = await readChakraConfigSheet(configSpreadsheetId, accessToken, getTabNames().chakraConfig)

    for (const [key, value] of Object.entries(raw)) {
      saveChakraConfigValue(key, value)
    }
    console.info(`[Chakra] Config sync: loaded ${Object.keys(raw).length} config entries`)
  } catch (err) {
    errors.push(`ChakraConfig sheet: ${err instanceof Error ? err.message : String(err)}`)
    console.warn('[Chakra] Config sync: failed to read ChakraConfig sheet:', err)
  }

  const config: ChakraConfig = {
    companyName: raw['company_name'] ?? getChakraConfigValue('company_name') ?? undefined,
    employeeSheetId:
      raw['employee_sheet_id'] ??
      getChakraConfigValue('employee_sheet_id') ??
      undefined,
    appCatalogSheetId:
      raw['app_catalog_sheet_id'] ??
      getChakraConfigValue('app_catalog_sheet_id') ??
      undefined,
    raw
  }

  return { success: errors.length === 0, config, errors }
}

// Resolve the employee/HR sheet ID from stored ChakraConfig values.
export const resolveEmployeeSheetId = (): string | null =>
  getChakraConfigValue('employee_sheet_id')

export const resolveAppCatalogSheetId = (): string | null =>
  getChakraConfigValue('app_catalog_sheet_id')
