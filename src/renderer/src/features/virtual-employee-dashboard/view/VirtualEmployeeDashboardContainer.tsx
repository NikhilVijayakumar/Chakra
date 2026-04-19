import type { FC } from 'react'
import { AppStateHandler, StateType } from 'astra'
import { useVirtualEmployeeDashboardViewModel } from '../viewmodel/useVirtualEmployeeDashboardViewModel'
import { VirtualEmployeeDashboardView } from './VirtualEmployeeDashboardView'

export const VirtualEmployeeDashboardContainer: FC = () => {
  const {
    dashboardState,
    currentEmployee,
    selectedMetric,
    editPanelOpen,
    editingMetric,
    canEdit,
    currentMetrics,
    loadDashboard,
    selectMetric,
    closeEditPanel,
    setEditField,
    updateMetricTarget
  } = useVirtualEmployeeDashboardViewModel()

  return (
    <AppStateHandler appState={dashboardState}>
      <VirtualEmployeeDashboardView
        dashboard={dashboardState.data ?? null}
        employee={currentEmployee}
        metrics={currentMetrics}
        selectedMetric={selectedMetric}
        editingMetric={editingMetric}
        editPanelOpen={editPanelOpen}
        isLoading={dashboardState.state === StateType.LOADING}
        canEdit={canEdit}
        onMetricSelect={selectMetric}
        onCloseEditPanel={closeEditPanel}
        onUpdateTarget={updateMetricTarget}
        onSetEditField={setEditField}
        onRefresh={loadDashboard}
      />
    </AppStateHandler>
  )
}
