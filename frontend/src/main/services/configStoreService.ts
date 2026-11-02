import { getDb } from '../db/init'
import { configs } from '../db/schema'
import { eq, and } from 'drizzle-orm'
import type { ConfigRow } from './googleSheetsService'

export const saveConfigs = (rows: ConfigRow[]): void => {
  const db = getDb()
  for (const row of rows) {
    const rowId = row.id || row.key
    db.insert(configs)
      .values({ id: rowId, key: row.key, value: row.value, status: row.status, isDirty: false, isDeleted: false })
      .onConflictDoUpdate({ target: configs.id, set: { value: row.value, status: row.status, isDirty: false } })
      .run()
  }
}

export const getConfigValue = (key: string): string | null => {
  try {
    const db = getDb()
    const row = db
      .select({ value: configs.value })
      .from(configs)
      .where(and(eq(configs.key, key), eq(configs.status, 'active'), eq(configs.isDeleted, false)))
      .get()
    return row?.value ?? null
  } catch {
    return null
  }
}

const safeInt = (val: string | null | undefined, fallback: number): number => {
  if (!val) return fallback
  const n = parseInt(val, 10)
  return isNaN(n) ? fallback : n
}

// Sync and channel settings sourced from the Config tab (employee sheet) → SQLite.
export interface SqliteSyncConfig {
  sync: {
    pushIntervalMs: number
    cronEnabled: boolean
    pushCronExpression: string
    pullCronExpression: string
  }
}

export const buildSyncConfigFromSQLite = (): SqliteSyncConfig | null => {
  const pushIntervalMs = getConfigValue('SYNC_PUSH_INTERVAL_MS')
  if (!pushIntervalMs) return null
  return {
    sync: {
      pushIntervalMs: safeInt(pushIntervalMs, 120000),
      cronEnabled: getConfigValue('SYNC_CRON_ENABLED') === 'true',
      pushCronExpression: getConfigValue('SYNC_PUSH_CRON_EXPRESSION') ?? '*/10 * * * *',
      pullCronExpression: getConfigValue('SYNC_PULL_CRON_EXPRESSION') ?? '*/15 * * * *'
    }
  }
}

export const buildEmailConfigFromSQLite = (): { agentMailApiKey: string | null; systemInboxId: string | null } => ({
  agentMailApiKey: getConfigValue('AGENTMAIL_API_KEY'),
  systemInboxId: getConfigValue('SYSTEM_INBOX_ID')
})
