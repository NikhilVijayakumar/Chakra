import { useEffect, useState, useCallback, useRef } from 'react'

export type DependencyId = 'ssh' | 'git' | 'virtual-drive'

const DEPENDENCY_LABELS: Record<DependencyId, string> = {
  ssh: 'SSH',
  git: 'Git',
  'virtual-drive': 'Virtual Drive'
}

export interface DependencyDiagnostic {
  dependency: DependencyId
  available: boolean
  source: 'PATH' | 'CONFIG'
  command: string
  message: string
}

export interface DependencyStatus {
  dependency: DependencyId
  status: 'pending' | 'loading' | 'success' | 'error'
  message?: string
}

export type CheckState = 'idle' | 'checking' | 'completed' | 'blocking'

interface CheckHostDependenciesResult {
  passed: boolean
  diagnostics: DependencyDiagnostic[]
}

const hasElectronBridge = (): boolean =>
  typeof window !== 'undefined' && typeof (window as any).api?.app?.checkHostDependencies === 'function'

const getDiagnosticsFromUrl = (): { key: string; message: string }[] | null => {
  if (typeof window === 'undefined') return null
  const params = new URLSearchParams(window.location.hash.split('?')[1] || '')
  const diagnosticsParam = params.get('diagnostics')
  if (!diagnosticsParam) return null
  try {
    return JSON.parse(decodeURIComponent(diagnosticsParam))
  } catch {
    return null
  }
}

const getMessageFromUrl = (): string => {
  if (typeof window === 'undefined') return ''
  const params = new URLSearchParams(window.location.hash.split('?')[1] || '')
  return params.get('message') || ''
}

export const useDependencyCheckViewModel = () => {
  const [checkState, setCheckState] = useState<CheckState>('idle')
  const [dependencyStatuses, setDependencyStatuses] = useState<DependencyStatus[]>([
    { dependency: 'ssh', status: 'pending' },
    { dependency: 'git', status: 'pending' },
    { dependency: 'virtual-drive', status: 'pending' }
  ])
  const [blockedMessage, setBlockedMessage] = useState<string>('')
  const isMountedRef = useRef(true)

  const runDependencyCheck = useCallback(async () => {
    setCheckState('checking')
    setBlockedMessage('')
    setDependencyStatuses([
      { dependency: 'ssh', status: 'loading' },
      { dependency: 'git', status: 'loading' },
      { dependency: 'virtual-drive', status: 'loading' }
    ])

    const isElectron = hasElectronBridge()

    if (!isElectron) {
      setDependencyStatuses([
        { dependency: 'ssh', status: 'success', message: 'Browser mode - SSH check skipped' },
        { dependency: 'git', status: 'success', message: 'Browser mode - Git check skipped' },
        { dependency: 'virtual-drive', status: 'success', message: 'Browser mode - Virtual drive check skipped' }
      ])
      setCheckState('completed')
      return
    }

    try {
      const result = await (window as any).api.app.checkHostDependencies() as CheckHostDependenciesResult
      
      const finalStatuses: DependencyStatus[] = result.diagnostics.map((d) => ({
        dependency: d.dependency,
        status: d.available ? 'success' as const : 'error' as const,
        message: d.message
      }))

      if (!isMountedRef.current) return
      setDependencyStatuses(finalStatuses)

      if (result.passed) {
        setCheckState('completed')
      } else {
        const failedDeps = result.diagnostics
          .filter((d) => !d.available)
          .map((d) => `${DEPENDENCY_LABELS[d.dependency]}: ${d.message}`)
          .join('; ')
        setBlockedMessage(failedDeps)
        setCheckState('blocking')
      }
    } catch (error) {
      if (!isMountedRef.current) return
      setCheckState('blocking')
      setBlockedMessage(error instanceof Error ? error.message : 'Dependency check failed')
      setDependencyStatuses((prev) =>
        prev.map((s) => ({ ...s, status: 'error' as const, message: 'Check failed' }))
      )
    }
  }, [])

  const handleRetry = useCallback(() => {
    void runDependencyCheck()
  }, [runDependencyCheck])

  const initializeFromUrl = useCallback(() => {
    // Check if diagnostics were passed via URL (from main process blocking)
    const urlDiagnostics = getDiagnosticsFromUrl()
    if (urlDiagnostics && urlDiagnostics.length > 0) {
      // Show all dependencies with their initial states
      const allDeps: DependencyId[] = ['ssh', 'git', 'virtual-drive']
      const statuses: DependencyStatus[] = allDeps.map((dep) => {
        const failed = urlDiagnostics.find((d) => d.key === dep)
        return {
          dependency: dep,
          status: failed ? 'error' as const : 'success' as const,
          message: failed ? failed.message : `${dep} check passed`
        }
      })
      setDependencyStatuses(statuses)
      setBlockedMessage(getMessageFromUrl())
      setCheckState('blocking')
      return true
    }
    return false
  }, [])

  useEffect(() => {
    isMountedRef.current = true
    
    // First check if we have preloaded diagnostics from URL
    if (initializeFromUrl()) {
      return () => {
        isMountedRef.current = false
      }
    }
    
    // Otherwise run the full check
    void runDependencyCheck()
    return () => {
      isMountedRef.current = false
    }
  }, [runDependencyCheck, initializeFromUrl])

  return {
    checkState,
    dependencyStatuses,
    blockedMessage,
    handleRetry,
    runDependencyCheck
  }
}
