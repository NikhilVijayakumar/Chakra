import { useEffect, useMemo, useState } from 'react'
import { useDataState } from 'astra'
import { KpiBreachAlertingRepo, type KpiBreachAlert } from '../repo/KpiBreachAlertingRepo'

export const useKpiBreachAlertingViewModel = () => {
  const repo = new KpiBreachAlertingRepo()
  const [breachState, executeLoad] = useDataState<KpiBreachAlert[]>()

  const [filterSeverity, setFilterSeverity] = useState<'ALL' | 'CRITICAL' | 'WARNING'>('ALL')
  const [statusFilter, setStatusFilter] = useState<'active' | 'acknowledged' | 'resolved'>('active')

  useEffect(() => {
    executeLoad(() => repo.getBreaches())
  }, [])

  const reload = async (): Promise<void> => {
    await executeLoad(() => repo.getBreaches())
  }

  const acknowledgeAlert = async (id: string): Promise<void> => {
    await repo.acknowledgeAlert(id)
    await reload()
  }

  const resolveAlert = async (id: string): Promise<void> => {
    await repo.resolveAlert(id)
    await reload()
  }

  const filteredBreaches = useMemo(() => {
    const source = breachState.data ?? []
    return source.filter((item) => {
      const severityMatch = filterSeverity === 'ALL' || item.severity === filterSeverity
      const statusMatch = item.status === statusFilter
      return severityMatch && statusMatch
    })
  }, [breachState.data, filterSeverity, statusFilter])

  return {
    breachState,
    filteredBreaches,
    filterSeverity,
    statusFilter,
    setFilterSeverity,
    setStatusFilter,
    acknowledgeAlert,
    resolveAlert,
    reload
  }
}
