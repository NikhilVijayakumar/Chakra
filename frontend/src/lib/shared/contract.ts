// Contract between Chakra UI and the `chakra` CLI. Mirrors planning/.../api-contract.md.
export const SUPPORTED_API_VERSION = 1

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
}
export interface SyncStatus {
  synced: boolean
  lastSyncAt: number | null
  contents: ContentSync[]
  pending: number
}
export interface SyncResult {
  results: { target: string; rows: number; ok: boolean; message?: string }[]
  pushed: number
  pendingLeft: number
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
  'content.get': ['content', 'get']
} as const
export type Op = keyof typeof OPS
export const APP_SCOPED: ReadonlySet<Op> = new Set<Op>(['app.info', 'app.can', 'content.get'])
export const LONG_OPS: ReadonlySet<Op> = new Set<Op>(['sync.run'])

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
