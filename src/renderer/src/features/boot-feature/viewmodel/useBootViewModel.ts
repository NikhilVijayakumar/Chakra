import { useEffect, useState, useRef, useCallback } from 'react'
import { BootSequenceStage } from '@renderer/common/components/boot-astra'

export type BootStageStatus = 'pending' | 'loading' | 'success' | 'error' | 'skipped'

const hasElectronBridge = (): boolean =>
  typeof window !== 'undefined' && typeof (window as any).api?.app?.bootstrapHost === 'function'

/**
 * useBootViewModel
 *
 * Boot sequence for the Prana sandbox architecture:
 * 1. Sandbox Runtime Bootstrap — host deps, notification centre, cron recovery
 * 2. Syncing Platform Data    — Google Sheets → SQLite (config, employees, apps)
 * 3. Loading Employee Directory — verify employees + config are in SQLite cache
 */
export const useBootViewModel = (onComplete: () => void, onSshFailure: () => void) => {
  const [stages, setStages] = useState<BootSequenceStage[]>([
    { id: 'sandbox-bootstrap', title: 'Sandbox Runtime Bootstrap', status: 'pending' },
    { id: 'sheets-sync', title: 'Syncing Platform Data', status: 'pending' },
    { id: 'data-ready', title: 'Loading Employee Directory', status: 'pending' },
  ])

  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const [isFatalActionableError, setIsFatalActionableError] = useState(false)
  const isExecutingRef = useRef(false)
  const isMountedRef = useRef(true)

  const updateStage = useCallback((index: number, updates: Partial<BootSequenceStage>) => {
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
        // ──── Step 0: Sandbox Runtime Bootstrap ────
        // Runs: host dependency checks, notification centre init, cron recovery.
        // Engine is already operational before this window opens (bootstrapPranaMain).
        if (currentIndex === 0) {
          updateStage(currentIndex, { status: 'loading', errorMessage: undefined })

          if (!isElectron) {
            updateStage(currentIndex, {
              status: 'skipped',
              detailMessage: 'Browser mode — Electron IPC unavailable.'
            })
          } else {
            try {
              const startup = await (window as any).api.app.bootstrapHost({})

              if (startup.overallStatus === 'BLOCKED') {
                const blockedStage = startup.stages?.find((s: any) => s.status === 'FAILED' && s.isBlocking)
                updateStage(currentIndex, {
                  status: 'error',
                  errorMessage: `Bootstrap blocked: ${blockedStage?.message ?? 'A blocking stage failed.'}`
                })
                setIsFatalActionableError(true)
                isExecutingRef.current = false
                return
              }

              const hostDeps = startup.stages?.find((s: any) => s.id === 'host-dependencies')
              const detailParts = [
                hostDeps?.status === 'SUCCESS' ? 'Host deps OK' : hostDeps?.status === 'FAILED' ? `Host deps: ${hostDeps.message}` : null,
                startup.overallStatus === 'DEGRADED' ? 'Some services degraded' : null,
              ].filter(Boolean)

              updateStage(currentIndex, {
                status: startup.overallStatus === 'READY' ? 'success' : 'success',
                detailMessage: detailParts.length > 0
                  ? detailParts.join(' · ')
                  : `Bootstrap complete (${startup.overallStatus}).`
              })

              // Ensure local data directory layout exists.
              try {
                if ((window as any).api?.app?.ensureDriveLayout) {
                  await (window as any).api.app.ensureDriveLayout()
                }
              } catch (layoutErr) {
                console.warn('[Chakra] ensureDriveLayout invoke failed:', layoutErr)
              }
            } catch (error: any) {
              updateStage(currentIndex, {
                status: 'error',
                errorMessage: error.message || 'Fatal error during sandbox runtime bootstrap.'
              })
              setIsFatalActionableError(true)
              isExecutingRef.current = false
              return
            }
          }

          currentIndex++
          if (isMountedRef.current) setCurrentStepIndex(currentIndex)
        }

        // ──── Step 1: Sync Platform Data (Google Sheets → SQLite) ────
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
                console.warn('[Chakra] Google service account unavailable:', authStatus?.error)
                updateStage(currentIndex, {
                  status: 'skipped',
                  detailMessage: `Google service account not available${authStatus?.error ? `: ${authStatus.error}` : ''}. Place the key file at config/chakra-service-account.json.`
                })
              } else {
                const result = await gs.sync()
                console.info('[Chakra] Sheets sync result:', result)
                if (result?.success) {
                  const parts = [
                    result.configsLoaded != null && `${result.configsLoaded} configs`,
                    result.employeesLoaded != null && `${result.employeesLoaded} employees`,
                    result.appsLoaded != null && `${result.appsLoaded} apps`
                  ].filter(Boolean).join(', ')
                  updateStage(currentIndex, {
                    status: 'success',
                    detailMessage: `Synced ${parts || 'data'} from Google Sheets.`
                  })
                } else {
                  const firstError = result?.errors?.[0] ?? 'Sync failed.'
                  console.warn('[Chakra] Sheets sync failed:', result?.errors)
                  updateStage(currentIndex, {
                    status: 'skipped',
                    detailMessage: `Sheets sync failed — ${firstError} Using cached data if available.`
                  })
                }
              }
            } catch (err: any) {
              console.warn('[Chakra] Sheets sync threw:', err)
              updateStage(currentIndex, {
                status: 'skipped',
                detailMessage: `Sheets sync unavailable: ${err?.message ?? 'unknown error'}. Using cached data.`
              })
            }
          }

          currentIndex++
          if (isMountedRef.current) setCurrentStepIndex(currentIndex)
        }

        // ──── Step 2: Verify Data Readiness (employees + config in SQLite) ────
        if (currentIndex === 2) {
          updateStage(currentIndex, { status: 'loading', errorMessage: undefined })

          if (!isElectron) {
            updateStage(currentIndex, {
              status: 'skipped',
              detailMessage: 'Browser mode — data readiness check skipped.'
            })
          } else {
            try {
              const gs = (window.api as any).googleSheets
              const readiness = await gs?.checkHostReady?.()

              if (readiness?.hasEmployees) {
                const countSuffix = readiness.employeeCount > 0 ? ` (${readiness.employeeCount} employees)` : ''
                updateStage(currentIndex, {
                  status: 'success',
                  detailMessage: `Employee data loaded${countSuffix}.`
                })
              } else if (!readiness?.hasConfig) {
                updateStage(currentIndex, {
                  status: 'skipped',
                  detailMessage: 'Config not set — add configSheetId to config/chakra-runtime.json.'
                })
              } else {
                updateStage(currentIndex, {
                  status: 'skipped',
                  detailMessage: 'No employee data in cache — sync from Google Sheets to load employees.'
                })
              }
            } catch (err: any) {
              updateStage(currentIndex, {
                status: 'skipped',
                detailMessage: `Data readiness check unavailable: ${err?.message ?? 'unknown'}. Using cached data.`
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
