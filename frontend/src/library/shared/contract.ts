// Contract between Chakra UI and the `chakra` CLI. Mirrors planning/.../api-contract.md.
export const SUPPORTED_API_VERSION = 2

export interface Ok<T> {
  ok: true
  data: T
  apiVersion?: number
}
export interface Fail {
  ok: false
  error: { code: string; message: string }
  apiVersion?: number
}
export type Envelope<T> = Ok<T> | Fail

export interface DoctorCheck {
  id: string
  ok: boolean
  message: string
}
export interface User {
  id: string
  email: string
  name: string
  role: string | null
}
export interface ContentSync {
  id: string
  synced: boolean
  rowCount: number
  lastSyncAt: number | null
  error: string | null
  /** Local edits not yet pushed to the sheet. */
  dirty: number
}
export interface SyncStatus {
  synced: boolean
  lastSyncAt: number | null
  contents: ContentSync[]
  /** Local edits not yet pushed. */
  pending: number
  /** Pending quarantine entries. */
  quarantined: number
}
export interface SyncResult {
  results: { target: string; rows: number; ok: boolean; pushed: number; message?: string }[]
  pushed: number
  pendingLeft: number
  quarantined: number
}
/** A content row: column name to text. Hidden columns (such as password hashes) are never present. */
export type Row = Record<string, string>
export type QuarantineReason = 'missing_id' | 'missing_required' | 'invalid_relation' | 'type_mismatch' | 'conflict'
export interface QuarantineEntry {
  id: string
  content: string
  recordId: string | null
  reason: QuarantineReason
  details: string
  sheetsData: Row
  localData: Row | null
  status: 'pending' | 'resolved' | 'rejected'
  createdAt: number
}
export interface AppInfo {
  appId: string
  enabled: boolean
  features: string[]
}
export interface CliConfig {
  cliPath: string | null
  version: string | null
  verifiedAt: number | null
}
export interface VerifyResult {
  version: string
  apiVersion: number
  checks: DoctorCheck[]
  healthy: boolean
}

/** Operations the renderer may request. `appId` is injected by main, never by the renderer. */
export const OPS = {
  'auth.login': ['auth', 'login'],
  'auth.validateEmail': ['auth', 'validate-email'],
  'auth.otpSend': ['auth', 'otp-send'],
  'auth.otpVerify': ['auth', 'otp-verify'],
  'auth.resetPassword': ['auth', 'reset-password'],
  'sync.run': ['sync', 'run'],
  'sync.status': ['sync', 'status'],
  'app.info': ['app', 'info'],
  'app.can': ['app', 'can'],
  'content.get': ['content', 'get'],
  'content.create': ['content', 'create'],
  'content.update': ['content', 'update'],
  'content.delete': ['content', 'delete'],
  'quarantine.list': ['quarantine', 'list'],
  'quarantine.count': ['quarantine', 'count'],
  'quarantine.reject': ['quarantine', 'reject'],
  'quarantine.acceptSheets': ['quarantine', 'accept-sheets'],
  'quarantine.applyLocal': ['quarantine', 'apply-local'],
  'quarantine.fix': ['quarantine', 'fix'],
  'quarantine.deleteRecord': ['quarantine', 'delete-record'],
  'quarantine.scan': ['quarantine', 'scan']
} as const
export type Op = keyof typeof OPS
export const APP_SCOPED: ReadonlySet<Op> = new Set<Op>(
  (Object.keys(OPS) as Op[]).filter((o) => o.startsWith('content.') || o.startsWith('quarantine.') || o.startsWith('app.'))
)
export const LONG_OPS: ReadonlySet<Op> = new Set<Op>(['sync.run', 'quarantine.scan'])

export interface ChakraApi {
  cli: {
    get(): Promise<CliConfig>
    verify(path: string): Promise<Envelope<VerifyResult>>
    save(path: string): Promise<Envelope<VerifyResult>>
    /** Verify the saved CLI: is it reachable, compatible and healthy right now? */
    status(): Promise<Envelope<VerifyResult>>
  }
  call<T = unknown>(op: Op, payload?: Record<string, unknown>): Promise<Envelope<T>>
}

export const IPC = { call: 'chakra:call', cliGet: 'chakra:cli:get', cliVerify: 'chakra:cli:verify', cliSave: 'chakra:cli:save', cliStatus: 'chakra:cli:status' } as const

declare global {
  interface Window {
    chakra?: ChakraApi
  }
}
