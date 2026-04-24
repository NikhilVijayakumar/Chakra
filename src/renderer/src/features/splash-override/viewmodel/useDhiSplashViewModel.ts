import { useEffect, useState, useRef, useCallback } from 'react'

export type StageStatus = 'pending' | 'loading' | 'success' | 'error' | 'skipped'

export interface SplashStage {
  id: string
  title: string
  status: StageStatus
  errorMessage?: string
  detailMessage?: string
}

const hasElectronBridge = (): boolean =>
  typeof window !== 'undefined' && typeof (window as any).api?.app?.bootstrapHost === 'function'

export const useDhiSplashViewModel = (onComplete: () => void, onSshFailure: () => void) => {
  const [stages, setStages] = useState<SplashStage[]>([
    { id: 'runtime', title: 'Platform Runtime Configuration', status: 'pending' },
    { id: 'sheets', title: 'Syncing Employee Directory from Google Sheets', status: 'pending' },
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
        // ──── Step 0: Platform Runtime (bootstrap + drive layout) ────
        if (currentIndex === 0) {
          updateStage(currentIndex, { status: 'loading', errorMessage: undefined })

          if (!isElectron) {
            updateStage(currentIndex, {
              status: 'skipped',
              detailMessage: 'Browser mode — Electron IPC unavailable.'
            })
          } else {
            try {
              let config: Record<string, unknown> = {}
              try {
                if ((window as any).api?.app?.getBootstrapConfig) {
                  const ipcConfig = await (window as any).api.app.getBootstrapConfig()
                  if (ipcConfig && typeof ipcConfig === 'object') {
                    config = ipcConfig as Record<string, unknown>
                  }
                }
              } catch {
                // best-effort
              }

              const startup = await (window as any).api.app.bootstrapHost({ config })

              if (startup.overallStatus === 'BLOCKED') {
                const blockedStage = startup.stages?.find((s: any) => s.status === 'BLOCKED')
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
              return
            }

            // Ensure virtual drive directory layout exists and init SQLite employee store.
            // Must run before sheets sync so the employee store path is set correctly.
            try {
              if ((window as any).api?.app?.ensureDriveLayout) {
                await (window as any).api.app.ensureDriveLayout()
              }
            } catch (layoutErr) {
              console.warn('[Chakra] ensureDriveLayout invoke failed:', layoutErr)
            }
          }

          currentIndex++
          if (isMountedRef.current) setCurrentStepIndex(currentIndex)
        }

        // ──── Step 1: Google Sheets — Employee Sync ────
        if (currentIndex === 1) {
          updateStage(currentIndex, { status: 'loading', errorMessage: undefined })

          if (!isElectron) {
            updateStage(currentIndex, {
              status: 'skipped',
              detailMessage: 'Browser mode — sheets sync skipped.'
            })
          } else {
            try {
              const gs = (window.api as any).googleSheets
              const authStatus = await gs?.getAuthStatus?.()

              if (!authStatus?.authenticated) {
                updateStage(currentIndex, {
                  status: 'skipped',
                  detailMessage: 'Google Sheets not connected — using cached employee data.'
                })
              } else {
                const result = await gs.sync()
                if (result?.success) {
                  updateStage(currentIndex, {
                    status: 'success',
                    detailMessage: `Synced ${result.departmentsLoaded} departments, ${result.designationsLoaded} designations, ${result.employeesLoaded} employees.`
                  })
                } else {
                  const firstError = result?.errors?.[0] ?? 'Sync failed.'
                  updateStage(currentIndex, {
                    status: 'skipped',
                    detailMessage: `Employee sync failed — ${firstError} Using cached data.`
                  })
                }
              }
            } catch (err: any) {
              updateStage(currentIndex, {
                status: 'skipped',
                detailMessage: `Sheets sync unavailable: ${err?.message ?? 'unknown error'}. Using cached data.`
              })
            }
          }

          currentIndex++
          if (isMountedRef.current) setCurrentStepIndex(currentIndex)
        }

        // ──── Step 2: SSH Verification ────
        if (currentIndex === 2) {
          updateStage(currentIndex, { status: 'loading', errorMessage: undefined })

          if (!isElectron) {
            updateStage(currentIndex, {
              status: 'skipped',
              detailMessage: 'Browser mode — SSH check skipped.'
            })
          } else {
            try {
              const dependencyStatus = await (window as any).api.app.getHostDependencyStatus?.()
              if (dependencyStatus && !dependencyStatus.passed) {
                updateStage(currentIndex, {
                  status: 'error',
                  errorMessage: dependencyStatus.message || 'Host dependencies are unavailable.'
                })
                isExecutingRef.current = false
                setTimeout(onSshFailure, 1500)
                return
              }

              const sshResult = await (window as any).api.auth.getStatus()

              if (!sshResult.sshVerified) {
                updateStage(currentIndex, {
                  status: 'error',
                  errorMessage: sshResult.sshMessage ?? 'SSH access denied.'
                })
                isExecutingRef.current = false
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

        // ──── Step 3: Vault Mount ────
        if (currentIndex === 3) {
          updateStage(currentIndex, { status: 'loading', errorMessage: undefined })
          await new Promise((r) => setTimeout(r, 500))
          updateStage(currentIndex, {
            status: 'success',
            detailMessage: 'Vault initialized.'
          })

          currentIndex++
          if (isMountedRef.current) setCurrentStepIndex(currentIndex)
        }

        // ──── Step 4: Gateway Probe ────
        if (currentIndex === 4) {
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
              updateStage(currentIndex, {
                status: 'success',
                detailMessage: 'Gateway probe failed — proceeding anyway.'
              })
            }
          }

          currentIndex++
          if (isMountedRef.current) setCurrentStepIndex(currentIndex)
        }

        // ──── All Done ────
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
