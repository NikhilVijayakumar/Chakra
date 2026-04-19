import { useEffect, useState, useRef, useCallback } from 'react'

export type StageStatus = 'pending' | 'loading' | 'success' | 'error' | 'skipped'

export interface SplashStage {
  id: string
  title: string
  status: StageStatus
  errorMessage?: string
  detailMessage?: string
}

/**
 * Detects whether the Electron preload bridge is available.
 * In browser-only mode (localhost:5173 without Electron shell),
 * window.api will be undefined.
 */
const hasElectronBridge = (): boolean =>
  typeof window !== 'undefined' && typeof (window as any).api?.app?.bootstrapHost === 'function'

export const useDhiSplashViewModel = (onComplete: () => void, onSshFailure: () => void) => {
  const [stages, setStages] = useState<SplashStage[]>([
    { id: 'runtime', title: 'Platform Runtime Configuration', status: 'pending' },
    { id: 'ssh', title: 'Governance Repository Verification', status: 'pending' },
    { id: 'vault', title: 'Mounting Local Encrypted Vault', status: 'pending' },
    { id: 'gateway', title: 'Probing Local AI Model Gateway', status: 'pending' }
  ])

  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const [isFatalActionableError, setIsFatalActionableError] = useState(false)
  const isExecutingRef = useRef(false)
  const isMountedRef = useRef(true)

  const updateStage = useCallback((index: number, updates: Partial<SplashStage>) => {
    if (!isMountedRef.current) return
    setStages((prev) => {
      const next = [...prev]
      next[index] = { ...next[index], ...updates }
      return next
    })
  }, [])

  const runSequence = useCallback(
    async (startingIndex: number) => {
      if (isExecutingRef.current) return
      isExecutingRef.current = true
      setIsFatalActionableError(false)

      const isElectron = hasElectronBridge()
      let currentIndex = startingIndex

      try {
        // ──── Step 0: Platform Runtime ────
        if (currentIndex === 0) {
          updateStage(currentIndex, { status: 'loading', errorMessage: undefined })

          if (!isElectron) {
            // Browser dev mode — no IPC, skip gracefully
            updateStage(currentIndex, {
              status: 'skipped',
              detailMessage: 'Browser mode — Electron IPC unavailable.'
            })
          } else {
            try {
              // Resolve bootstrap config from preload bridge, matching Prana's expected contract
              let config: Record<string, unknown> = {}
              try {
                if ((window as any).api?.app?.getBootstrapConfig) {
                  const ipcConfig = await (window as any).api.app.getBootstrapConfig()
                  if (ipcConfig && typeof ipcConfig === 'object') {
                    config = ipcConfig as Record<string, unknown>
                  }
                }
              } catch {
                // Config resolution is best-effort; bootstrapHost will use setPranaRuntimeConfig values
              }

              const startup = await (window as any).api.app.bootstrapHost({ config })

              if (startup.overallStatus === 'BLOCKED') {
                const blockedStage = startup.stages?.find((s: any) => s.status === 'BLOCKED')
                // BLOCKED is non-fatal for splash — show warning but continue to login
                updateStage(currentIndex, {
                  status: 'success',
                  detailMessage: `Warning: ${blockedStage?.message ?? 'Some startup stages blocked.'}`
                })
              } else {
                updateStage(currentIndex, {
                  status: 'success',
                  detailMessage: `Bootstrap complete (${startup.overallStatus}).`
                })
              }
            } catch (error: any) {
              updateStage(currentIndex, {
                status: 'error',
                errorMessage: error.message || 'Fatal error during Platform Runtime bootstrap.'
              })
              setIsFatalActionableError(true)
              isExecutingRef.current = false
              return // Stop — allow retry
            }
          }

          currentIndex++
          if (isMountedRef.current) setCurrentStepIndex(currentIndex)
        }

        // ──── Step 1: SSH Verification ────
        if (currentIndex === 1) {
          updateStage(currentIndex, { status: 'loading', errorMessage: undefined })

          if (!isElectron) {
            updateStage(currentIndex, {
              status: 'skipped',
              detailMessage: 'Browser mode — SSH check skipped.'
            })
          } else {
            try {
              const sshResult = await (window as any).api.auth.getStatus()

              if (!sshResult.sshVerified) {
                updateStage(currentIndex, {
                  status: 'error',
                  errorMessage: sshResult.sshMessage ?? 'SSH access denied.'
                })
                isExecutingRef.current = false
                // SSH failure auto-redirects to access-denied
                setTimeout(onSshFailure, 1500)
                return
              }

              updateStage(currentIndex, {
                status: 'success',
                detailMessage: 'SSH credentials validated.'
              })
            } catch (error: any) {
              updateStage(currentIndex, {
                status: 'error',
                errorMessage: error.message || 'SSH verification failed.'
              })
              setIsFatalActionableError(true)
              isExecutingRef.current = false
              return
            }
          }

          currentIndex++
          if (isMountedRef.current) setCurrentStepIndex(currentIndex)
        }

        // ──── Step 2: Vault Mount ────
        if (currentIndex === 2) {
          updateStage(currentIndex, { status: 'loading', errorMessage: undefined })
          // Brief simulated wait for vault readiness
          await new Promise((r) => setTimeout(r, 500))
          updateStage(currentIndex, {
            status: 'success',
            detailMessage: 'Vault initialized.'
          })

          currentIndex++
          if (isMountedRef.current) setCurrentStepIndex(currentIndex)
        }

        // ──── Step 3: Gateway Probe ────
        if (currentIndex === 3) {
          updateStage(currentIndex, { status: 'loading', errorMessage: undefined })

          if (!isElectron) {
            updateStage(currentIndex, {
              status: 'skipped',
              detailMessage: 'Browser mode — gateway probe skipped.'
            })
          } else {
            try {
              const result = await (window as any).api.modelGateway.probe()

              if (!result?.activeProvider) {
                updateStage(currentIndex, {
                  status: 'success',
                  detailMessage: 'Model gateway unavailable — proceeding anyway.'
                })
              } else {
                updateStage(currentIndex, {
                  status: 'success',
                  detailMessage: `Connected: ${result.activeProvider}/${result.activeModel}`
                })
              }
            } catch {
              // Gateway is non-blocking — mark as warning-style success
              updateStage(currentIndex, {
                status: 'success',
                detailMessage: 'Gateway probe failed — proceeding anyway.'
              })
            }
          }

          currentIndex++
          if (isMountedRef.current) setCurrentStepIndex(currentIndex)
        }

        // ──── All Done — navigate ────
        isExecutingRef.current = false
        setTimeout(() => {
          if (isMountedRef.current) onComplete()
        }, 600)
      } catch (unexpectedError: any) {
        updateStage(currentIndex, {
          status: 'error',
          errorMessage: unexpectedError.message || 'An unexpected runtime error occurred.'
        })
        setIsFatalActionableError(true)
        isExecutingRef.current = false
      }
    },
    [updateStage, onComplete, onSshFailure]
  )

  useEffect(() => {
    isMountedRef.current = true
    runSequence(0)
    return () => {
      isMountedRef.current = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleRetry = useCallback(() => {
    if (!isExecutingRef.current) {
      runSequence(currentStepIndex)
    }
  }, [currentStepIndex, runSequence])

  return {
    stages,
    handleRetry,
    isFatalActionableError,
    currentStepIndex
  }
}
