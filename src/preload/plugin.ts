import { contextBridge, ipcRenderer } from 'electron'

// Restricted preload for plugin WebContentsViews.
// Exposes two globals:
//   window.pluginApi — portable sandbox API (sqlite, notifications, runtime)
//   window.api       — Mula-compatible legacy API surface (mula:* IPC channels
//                      registered by mulaPluginBridgeService in Chakra's main process)

const pluginApi = {
  sqlite: {
    read: <T = Record<string, unknown>>(table: string, query?: Record<string, unknown>): Promise<T[]> =>
      ipcRenderer.invoke('plugin:sqlite:read', { table, query }),
    write: (table: string, rows: Record<string, unknown>[]): Promise<{ written: number }> =>
      ipcRenderer.invoke('plugin:sqlite:write', { table, rows }),
    exec: (sql: string): Promise<void> =>
      ipcRenderer.invoke('plugin:sqlite:exec', { sql }),
  },
  notifications: {
    emit: (eventType: string, payload: Record<string, unknown>): Promise<void> =>
      ipcRenderer.invoke('plugin:notifications:emit', { eventType, payload }),
  },
  runtime: {
    getInfo: (): Promise<{ runtimeId: string; sessionId: string; capabilities: Record<string, unknown> }> =>
      ipcRenderer.invoke('plugin:runtime:info'),
  },
}

// Helper: builds the standard CRUD+sync object for a Mula module.
const mulaModule = (name: string) => ({
  getAll: () => ipcRenderer.invoke(`mula:${name}:getAll`),
  getById: (id: string) => ipcRenderer.invoke(`mula:${name}:getById`, { id }),
  create: (record: Record<string, unknown>) => ipcRenderer.invoke(`mula:${name}:create`, { record }),
  update: (id: string, record: Record<string, unknown>) => ipcRenderer.invoke(`mula:${name}:update`, { id, record }),
  delete: (id: string) => ipcRenderer.invoke(`mula:${name}:delete`, { id }),
  sync: () => ipcRenderer.invoke(`mula:${name}:sync`),
})

// Mula-compatible window.api — channel names match Mula's own preload exactly so
// Mula's renderer code works unchanged when running as a Chakra plugin.
const api = {
  employee: mulaModule('employee'),
  department: mulaModule('department'),
  designation: mulaModule('designation'),
  team: mulaModule('team'),
  attendanceKey: mulaModule('attendance-key'),
  holiday: mulaModule('holiday'),
  leave: mulaModule('leave'),
  employeeTeam: mulaModule('employee-team'),
  configuration: mulaModule('configuration'),
  syncStatus: {
    get: () => ipcRenderer.invoke('mula:sync-status'),
  },
  googleSheets: {
    getAuthStatus: () => ipcRenderer.invoke('mula:google-auth-status'),
    setEmployeeSheetId: (sheetId: string) => ipcRenderer.invoke('mula:sheets-set', { sheetId }),
    sync: () => ipcRenderer.invoke('mula:sheets-sync'),
    onSyncComplete: (_cb: (result: unknown) => void) => {
      // Event-based sync notification is not supported in plugin context; no-op.
    },
  },
  quarantine: {
    getAll: (status?: string) => ipcRenderer.invoke('mula:quarantine:getAll', { status }),
    count: () => ipcRenderer.invoke('mula:quarantine:count'),
    fix: (id: string, record: Record<string, unknown>) => ipcRenderer.invoke('mula:quarantine:fix', { id, record }),
    deleteRecord: (id: string) => ipcRenderer.invoke('mula:quarantine:delete-record', { id }),
    scan: () => ipcRenderer.invoke('mula:quarantine:scan'),
  },
}

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('pluginApi', pluginApi)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error('[PluginPreload] contextBridge expose failed:', error)
  }
} else {
  // @ts-ignore
  window.pluginApi = pluginApi
  // @ts-ignore
  window.api = api
}
