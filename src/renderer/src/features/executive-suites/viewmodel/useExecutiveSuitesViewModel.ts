import { useCallback, useEffect, useMemo, useState } from 'react'
import { useDataState } from 'astra'
import {
  ExecutiveSuitesPayload,
  ExecutiveSuitesRepo,
  SocialTrendIntelligenceOutputPayload
} from '../repo/ExecutiveSuitesRepo'

export const useExecutiveSuitesViewModel = () => {
  const repo = useMemo(() => new ExecutiveSuitesRepo(), [])
  const [suiteState, executeLoad] = useDataState<ExecutiveSuitesPayload>()
  const [trendOutput, setTrendOutput] = useState<SocialTrendIntelligenceOutputPayload | null>(null)
  const [isRunningTrendIntelligence, setIsRunningTrendIntelligence] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const loadSnapshot = useCallback(async () => {
    setErrorMessage(null)
    await executeLoad(() => repo.getDirectorOfficeSnapshot())
  }, [executeLoad, repo])

  const runTrendIntelligence = useCallback(async () => {
    setErrorMessage(null)
    setIsRunningTrendIntelligence(true)
    try {
      const response = await repo.runSocialTrendIntelligence()
      setTrendOutput(response.data ?? null)
      await loadSnapshot()
    } catch (error) {
      const normalizedError =
        error instanceof Error ? error.message : 'Unable to run trend intelligence.'
      setErrorMessage(normalizedError)
    } finally {
      setIsRunningTrendIntelligence(false)
    }
  }, [loadSnapshot, repo])

  useEffect(() => {
    loadSnapshot()
  }, [loadSnapshot])

  return {
    suiteState,
    reload: loadSnapshot,
    trendOutput,
    isRunningTrendIntelligence,
    runTrendIntelligence,
    errorMessage
  }
}
