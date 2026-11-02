import { useEffect } from 'react'
import { useDataState } from 'astra'
import { DashboardPayload, DashboardRepo } from '../repo/DashboardRepo'

export const useDashboardViewModel = () => {
  const repo = new DashboardRepo()
  const [dashboardState, executeLoad] = useDataState<DashboardPayload>()

  useEffect(() => {
    executeLoad(() => repo.getDashboard())
  }, [])

  return {
    dashboardState,
    reload: () => executeLoad(() => repo.getDashboard())
  }
}
