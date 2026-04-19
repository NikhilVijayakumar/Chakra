import { useEffect } from 'react'
import { useDataState } from 'astra'
import { DailyBriefRepo, DailyBriefPayload } from '../repo/DailyBriefRepo'

export const useDailyBriefViewModel = () => {
  const repo = new DailyBriefRepo()
  const [briefState, executeLoad] = useDataState<DailyBriefPayload>()

  useEffect(() => {
    executeLoad(() => repo.getDailyBrief())
  }, [])

  return {
    briefState,
    reload: () => executeLoad(() => repo.getDailyBrief())
  }
}
