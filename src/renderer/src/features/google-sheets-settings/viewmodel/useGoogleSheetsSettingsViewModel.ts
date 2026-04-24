import { useState, useEffect, useCallback } from 'react'

export interface GoogleAuthStatus {
  authenticated: boolean
  email?: string
  expiresAt?: number
}

export interface SheetConfig {
  config_sheet_id: string
  employee_sheet_id: string
}

export interface SyncResult {
  success: boolean
  configKeysLoaded?: number
  employeesLoaded?: number
  errors?: string[]
}

export const useGoogleSheetsSettingsViewModel = () => {
  const [authStatus, setAuthStatus] = useState<GoogleAuthStatus>({ authenticated: false })
  const [sheetConfig, setSheetConfig] = useState<SheetConfig>({
    config_sheet_id: '',
    employee_sheet_id: ''
  })
  const [isLoadingStatus, setIsLoadingStatus] = useState(true)
  const [isConnecting, setIsConnecting] = useState(false)
  const [isRevoking, setIsRevoking] = useState(false)
  const [isSavingConfig, setIsSavingConfig] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)
  const [syncResult, setSyncResult] = useState<SyncResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const gs = (window as any).api?.googleSheets

  const loadStatus = useCallback(async () => {
    if (!gs) return
    setIsLoadingStatus(true)
    try {
      const [status, config] = await Promise.all([gs.getAuthStatus(), gs.getSheetConfig()])
      setAuthStatus(status ?? { authenticated: false })
      if (config) {
        setSheetConfig({
          config_sheet_id: config.config_sheet_id ?? '',
          employee_sheet_id: config.employee_sheet_id ?? ''
        })
      }
    } catch (err: any) {
      setError(err?.message ?? 'Failed to load Google Sheets status.')
    } finally {
      setIsLoadingStatus(false)
    }
  }, [gs])

  useEffect(() => {
    loadStatus()
  }, [loadStatus])

  const handleConnect = useCallback(async () => {
    if (!gs) return
    setIsConnecting(true)
    setError(null)
    try {
      const result = await gs.startAuth()
      if (result?.success) {
        setSuccessMessage('Google account connected successfully.')
        await loadStatus()
      } else {
        setError(result?.error ?? 'OAuth flow failed or was cancelled.')
      }
    } catch (err: any) {
      setError(err?.message ?? 'Failed to start OAuth flow.')
    } finally {
      setIsConnecting(false)
    }
  }, [gs, loadStatus])

  const handleRevoke = useCallback(async () => {
    if (!gs) return
    setIsRevoking(true)
    setError(null)
    try {
      await gs.revokeAuth()
      setAuthStatus({ authenticated: false })
      setSuccessMessage('Google account disconnected.')
    } catch (err: any) {
      setError(err?.message ?? 'Failed to revoke access.')
    } finally {
      setIsRevoking(false)
    }
  }, [gs])

  const handleSaveConfig = useCallback(async () => {
    if (!gs) return
    setIsSavingConfig(true)
    setError(null)
    try {
      await gs.setSheetConfig(sheetConfig)
      setSuccessMessage('Sheet IDs saved.')
    } catch (err: any) {
      setError(err?.message ?? 'Failed to save sheet configuration.')
    } finally {
      setIsSavingConfig(false)
    }
  }, [gs, sheetConfig])

  const handleSync = useCallback(async () => {
    if (!gs) return
    setIsSyncing(true)
    setError(null)
    setSyncResult(null)
    try {
      const result: SyncResult = await gs.sync()
      setSyncResult(result)
      if (result?.success) {
        setSuccessMessage(
          `Sync complete — ${result.configKeysLoaded ?? 0} config keys, ${result.employeesLoaded ?? 0} employees loaded.`
        )
      } else {
        const firstError = result?.errors?.[0] ?? 'Sync failed.'
        setError(`Sync failed: ${firstError}`)
      }
    } catch (err: any) {
      setError(err?.message ?? 'Sync failed.')
    } finally {
      setIsSyncing(false)
    }
  }, [gs])

  const clearMessages = useCallback(() => {
    setError(null)
    setSuccessMessage(null)
  }, [])

  return {
    authStatus,
    sheetConfig,
    setSheetConfig,
    isLoadingStatus,
    isConnecting,
    isRevoking,
    isSavingConfig,
    isSyncing,
    syncResult,
    error,
    successMessage,
    handleConnect,
    handleRevoke,
    handleSaveConfig,
    handleSync,
    clearMessages,
    isElectron: !!gs
  }
}
