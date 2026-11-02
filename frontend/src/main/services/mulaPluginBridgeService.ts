/**
 * Mula plugin bridge — registers mula:* IPC handlers that delegate to Chakra's SQLite.
 *
 * When Mula runs as a Chakra plugin (WebContentsView), its renderer uses window.api.*
 * which invokes mula:* IPC channels. Chakra must handle those channels against its own
 * SQLite cache so Mula reads/writes the same data Chakra already manages.
 *
 * Schema divergence: Chakra's employee_teams has composite PK (employeeId+teamId);
 * Mula's has an id field. Bridge synthesises id = "${employeeId}_${teamId}" for reads
 * and parses it back for writes.
 */

import type { IpcMain } from 'electron'

const MODULE_ID_PREFIXES: Record<string, string> = {
  'department': 'DEPT',
  'designation': 'DES',
  'team': 'TEAM',
  'employee': 'EMP',
  'attendance-key': 'ATT',
  'holiday': 'HOL',
  'leave': 'LEA',
  'configuration': 'CFG',
}

const generateNextId = (prefix: string, existingIds: string[]): string => {
  const maxNum = existingIds.reduce((max, id) => {
    const match = id.match(/(\d+)$/)
    return match ? Math.max(max, parseInt(match[1], 10)) : max
  }, 0)
  return `${prefix}${String(maxNum + 1).padStart(3, '0')}`
}

export const registerMulaBridge = async (ipcMain: IpcMain): Promise<void> => {
  const { getDb } = await import('../db/init')
  const schema = await import('../db/schema')
  const { eq } = await import('drizzle-orm')

  // ── Module CRUD handlers (employee, department, designation, team, etc.) ──────
  // Each module registers getAll, getById, create, update, delete, sync.

  const modules = [
    { name: 'employee', table: schema.employees as any },
    { name: 'department', table: schema.departments as any },
    { name: 'designation', table: schema.designations as any },
    { name: 'team', table: schema.teams as any },
    { name: 'attendance-key', table: schema.attendanceKeys as any },
    { name: 'holiday', table: schema.holidays as any },
    { name: 'leave', table: schema.leaves as any },
    { name: 'configuration', table: schema.configs as any },
  ]

  for (const mod of modules) {
    const prefix = `mula:${mod.name}`

    ipcMain.handle(`${prefix}:getAll`, async () => {
      try {
        const db = getDb()

        if (mod.name === 'employee') {
          const records = db.select().from(mod.table).where(eq(mod.table.isDeleted, false)).all()
          const deptMap = new Map<string, string>()
          const desigMap = new Map<string, string>()
          try {
            const depts = db.select().from(schema.departments).where(eq(schema.departments.isDeleted, false)).all()
            depts.forEach((d: any) => deptMap.set(d.id, d.name))
          } catch { /* ignore */ }
          try {
            const desigs = db.select().from(schema.designations).where(eq(schema.designations.isDeleted, false)).all()
            desigs.forEach((d: any) => desigMap.set(d.id, d.name))
          } catch { /* ignore */ }
          const enriched = records.map((r: any) => ({
            ...r,
            departmentName: r.departmentId ? deptMap.get(r.departmentId) ?? r.departmentId : '',
            designationName: r.designationId ? desigMap.get(r.designationId) ?? r.designationId : '',
          }))
          return { success: true, data: enriched }
        }

        const records = db.select().from(mod.table).where(eq(mod.table.isDeleted, false)).all()
        return { success: true, data: records }
      } catch (err) {
        return { success: false, error: (err as Error).message }
      }
    })

    ipcMain.handle(`${prefix}:getById`, async (_event, payload: { id: string }) => {
      try {
        const db = getDb()
        const record = db.select().from(mod.table).where(eq(mod.table.id, payload.id)).get()
        return { success: true, data: record ?? null }
      } catch (err) {
        return { success: false, error: (err as Error).message }
      }
    })

    ipcMain.handle(`${prefix}:create`, async (_event, payload: { record: Record<string, unknown> }) => {
      try {
        const db = getDb()
        const record: Record<string, unknown> = {
          ...payload.record,
          isDirty: true,
          isDeleted: false,
          sync: Math.floor(Date.now() / 1000),
        }

        if (!record.id) {
          const idPrefix = MODULE_ID_PREFIXES[mod.name]
          if (idPrefix) {
            const allRows = db.select().from(mod.table).all()
            const existingIds = allRows.map((r: any) => String(r.id ?? ''))
            record.id = generateNextId(idPrefix, existingIds)
          }
        }

        if (mod.name === 'employee' && !record.passwordHash) {
          const bcrypt = (await import('bcryptjs')).default
          record.passwordHash = await bcrypt.hash('change@123', 10)
        }

        db.insert(mod.table).values(record).run()
        return { success: true, data: record }
      } catch (err) {
        return { success: false, error: (err as Error).message }
      }
    })

    ipcMain.handle(`${prefix}:update`, async (_event, payload: { id: string; record: Record<string, unknown> }) => {
      try {
        const db = getDb()
        const { id: _dropId, ...rest } = payload.record
        const updateData: Record<string, unknown> = {
          ...rest,
          isDirty: true,
          sync: Math.floor(Date.now() / 1000),
        }

        if (mod.name === 'employee' && updateData.passwordHash && typeof updateData.passwordHash === 'string' && !updateData.passwordHash.startsWith('$2')) {
          const bcrypt = (await import('bcryptjs')).default
          updateData.passwordHash = await bcrypt.hash(updateData.passwordHash, 10)
        }

        db.update(mod.table).set(updateData).where(eq(mod.table.id, payload.id)).run()
        return { success: true }
      } catch (err) {
        return { success: false, error: (err as Error).message }
      }
    })

    ipcMain.handle(`${prefix}:delete`, async (_event, payload: { id: string }) => {
      try {
        const db = getDb()
        db.update(mod.table)
          .set({ isDeleted: true, isDirty: true, sync: Math.floor(Date.now() / 1000) })
          .where(eq(mod.table.id, payload.id))
          .run()
        return { success: true }
      } catch (err) {
        return { success: false, error: (err as Error).message }
      }
    })

    ipcMain.handle(`${prefix}:sync`, async () => {
      try {
        const { getBootstrapConfigSheetId } = await import('./bootstrapConfigService')
        const sheetId = getBootstrapConfigSheetId() ?? ''
        if (!sheetId) return { success: false, error: 'No spreadsheet ID configured' }
        const { syncHrFromSheets } = await import('./sheetsSyncService')
        return await syncHrFromSheets(sheetId)
      } catch (err) {
        return { success: false, error: (err as Error).message }
      }
    })
  }

  // ── employee-team: special handling for Chakra's composite PK schema ──────────
  // Chakra: PK = (employeeId, teamId). Mula expects an `id` field.
  // Bridge synthesises id = "${employeeId}_${teamId}" for round-trips.

  ipcMain.handle('mula:employee-team:getAll', async () => {
    try {
      const db = getDb()
      const records = db.select().from(schema.employeeTeams).where(eq(schema.employeeTeams.isDeleted, false)).all()
      const empMap = new Map<string, string>()
      const teamMap = new Map<string, string>()
      try {
        const emps = db.select().from(schema.employees).where(eq(schema.employees.isDeleted, false)).all()
        emps.forEach((e: any) => empMap.set(e.id, e.name))
      } catch { /* ignore */ }
      try {
        const teamRows = db.select().from(schema.teams).where(eq(schema.teams.isDeleted, false)).all()
        teamRows.forEach((t: any) => teamMap.set(t.id, t.name))
      } catch { /* ignore */ }
      const enriched = records.map((r: any) => ({
        ...r,
        id: `${r.employeeId}_${r.teamId}`,
        employeeName: r.employeeId ? empMap.get(r.employeeId) ?? r.employeeId : '',
        teamName: r.teamId ? teamMap.get(r.teamId) ?? r.teamId : '',
      }))
      return { success: true, data: enriched }
    } catch (err) {
      return { success: false, error: (err as Error).message }
    }
  })

  ipcMain.handle('mula:employee-team:getById', async (_event, payload: { id: string }) => {
    try {
      const db = getDb()
      const [employeeId, teamId] = payload.id.split('_')
      const record = db.select().from(schema.employeeTeams)
        .where(eq(schema.employeeTeams.employeeId, employeeId))
        .all()
        .find((r: any) => r.teamId === teamId) ?? null
      return { success: true, data: record ? { ...record, id: payload.id } : null }
    } catch (err) {
      return { success: false, error: (err as Error).message }
    }
  })

  ipcMain.handle('mula:employee-team:create', async (_event, payload: { record: Record<string, unknown> }) => {
    try {
      const db = getDb()
      const { id: _dropId, ...rest } = payload.record
      const record: Record<string, unknown> = {
        ...rest,
        isDirty: true,
        isDeleted: false,
        sync: Math.floor(Date.now() / 1000),
      }
      db.insert(schema.employeeTeams as any).values(record).onConflictDoUpdate({
        target: [schema.employeeTeams.employeeId, schema.employeeTeams.teamId],
        set: record,
      }).run()
      return { success: true, data: { ...record, id: `${record.employeeId}_${record.teamId}` } }
    } catch (err) {
      return { success: false, error: (err as Error).message }
    }
  })

  ipcMain.handle('mula:employee-team:update', async (_event, payload: { id: string; record: Record<string, unknown> }) => {
    try {
      const db = getDb()
      const [employeeId] = payload.id.split('_')
      const { id: _dropId, ...rest } = payload.record
      const updateData: Record<string, unknown> = {
        ...rest,
        isDirty: true,
        sync: Math.floor(Date.now() / 1000),
      }
      db.update(schema.employeeTeams as any).set(updateData)
        .where(eq(schema.employeeTeams.employeeId, employeeId))
        .run()
      return { success: true }
    } catch (err) {
      return { success: false, error: (err as Error).message }
    }
  })

  ipcMain.handle('mula:employee-team:delete', async (_event, payload: { id: string }) => {
    try {
      const db = getDb()
      const [employeeId] = payload.id.split('_')
      db.update(schema.employeeTeams as any)
        .set({ isDeleted: true, isDirty: true, sync: Math.floor(Date.now() / 1000) })
        .where(eq(schema.employeeTeams.employeeId, employeeId))
        .run()
      return { success: true }
    } catch (err) {
      return { success: false, error: (err as Error).message }
    }
  })

  ipcMain.handle('mula:employee-team:sync', async () => {
    try {
      const { getBootstrapConfigSheetId } = await import('./bootstrapConfigService')
      const sheetId = getBootstrapConfigSheetId() ?? ''
      if (!sheetId) return { success: false, error: 'No spreadsheet ID configured' }
      const { syncHrFromSheets } = await import('./sheetsSyncService')
      return await syncHrFromSheets(sheetId)
    } catch (err) {
      return { success: false, error: (err as Error).message }
    }
  })

  // ── Sync status ───────────────────────────────────────────────────────────────

  ipcMain.handle('mula:sync-status', async () => {
    try {
      const db = getDb()
      const tableEntries: Array<[string, any]> = [
        ['departments', schema.departments],
        ['designations', schema.designations],
        ['teams', schema.teams],
        ['attendanceKeys', schema.attendanceKeys],
        ['holidays', schema.holidays],
        ['leaves', schema.leaves],
        ['employees', schema.employees],
        ['configs', schema.configs],
        ['employeeTeams', schema.employeeTeams],
      ]
      const counts: Record<string, number> = {}
      for (const [name, table] of tableEntries) {
        try {
          const dirty = db.select().from(table).where(eq(table.isDirty, true)).all()
          counts[name] = dirty.length
        } catch {
          counts[name] = 0
        }
      }
      return { success: true, dirtyCounts: counts }
    } catch (err) {
      return { success: false, error: (err as Error).message }
    }
  })

  // ── Google Sheets passthrough ─────────────────────────────────────────────────

  ipcMain.handle('mula:google-auth-status', async () => {
    try {
      const { getServiceAccountStatus } = await import('./googleServiceAccountService')
      const { getBootstrapConfigSheetId } = await import('./bootstrapConfigService')
      const status = await getServiceAccountStatus()
      return {
        authenticated: status.available,
        serviceAccountEmail: status.email,
        employee_sheet_id: getBootstrapConfigSheetId() ?? undefined,
        error: status.error,
      }
    } catch (err) {
      return { authenticated: false, error: (err as Error).message }
    }
  })

  ipcMain.handle('mula:sheets-set', async (_event, payload: { sheetId: string }) => {
    // Sheet IDs come from chakra-runtime.json, not from Mula plugin — no-op bridge.
    console.info('[MulaBridge] mula:sheets-set ignored (sheet IDs managed by Chakra bootstrap):', payload.sheetId)
    return { success: true }
  })

  ipcMain.handle('mula:sheets-sync', async () => {
    try {
      const { getServiceAccountStatus } = await import('./googleServiceAccountService')
      const status = await getServiceAccountStatus()
      if (!status.available) {
        return { success: false, errors: [status.error ?? 'Service account not available'] }
      }
      const { getBootstrapConfigSheetId } = await import('./bootstrapConfigService')
      const sheetId = getBootstrapConfigSheetId() ?? ''
      if (!sheetId) return { success: false, errors: ['configSheetId not set'] }
      const { syncHrFromSheets } = await import('./sheetsSyncService')
      return await syncHrFromSheets(sheetId)
    } catch (err) {
      return { success: false, errors: [(err as Error).message] }
    }
  })

  // ── Quarantine stubs ──────────────────────────────────────────────────────────
  // Chakra doesn't have a quarantine table. Return empty/zero responses so Mula's
  // data-health view renders without crashing.

  ipcMain.handle('mula:quarantine:count', async () => ({ success: true, count: 0 }))
  ipcMain.handle('mula:quarantine:getAll', async () => ({ success: true, data: [] }))
  ipcMain.handle('mula:quarantine:reject', async () => ({ success: true }))
  ipcMain.handle('mula:quarantine:accept-sheets', async () => ({ success: true }))
  ipcMain.handle('mula:quarantine:apply-local', async () => ({ success: true }))
  ipcMain.handle('mula:quarantine:fix', async () => ({ success: true }))
  ipcMain.handle('mula:quarantine:delete-record', async () => ({ success: true }))
  ipcMain.handle('mula:quarantine:scan', async () => ({ success: true, quarantined: 0 }))

  console.info('[Chakra] Registered mula:* plugin IPC handlers')
}
