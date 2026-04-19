import type { FC } from 'react'
import { AppStateHandler, StateType } from 'astra'
import { KpiBreachAlertingView } from './KpiBreachAlertingView'
import { useKpiBreachAlertingViewModel } from '../viewmodel/useKpiBreachAlertingViewModel'

export const KpiBreachAlertingContainer: FC = () => {
  const {
    breachState,
    filteredBreaches,
    filterSeverity,
    statusFilter,
    setFilterSeverity,
    setStatusFilter,
    acknowledgeAlert,
    resolveAlert,
    reload
  } = useKpiBreachAlertingViewModel()

  return (
    <AppStateHandler appState={breachState}>
      <KpiBreachAlertingView
        breaches={filteredBreaches}
        isLoading={breachState.state === StateType.LOADING}
        error={null}
        filterSeverity={filterSeverity}
        statusFilter={statusFilter}
        onFilterSeverity={setFilterSeverity}
        onFilterStatus={setStatusFilter}
        onAcknowledge={acknowledgeAlert}
        onResolve={resolveAlert}
        onRefresh={reload}
      />
    </AppStateHandler>
  )
}
