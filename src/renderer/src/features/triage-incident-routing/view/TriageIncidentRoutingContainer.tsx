import type { FC } from 'react'
import { AppStateHandler, StateType } from 'astra'
import { TriageIncidentRoutingView } from './TriageIncidentRoutingView'
import { useTriageIncidentRoutingViewModel } from '../viewmodel/useTriageIncidentRoutingViewModel'

export const TriageIncidentRoutingContainer: FC = () => {
  const {
    incidentsState,
    selectedIncident,
    availableHandlers,
    selectIncident,
    assignIncident,
    escalateIncident,
    reload
  } = useTriageIncidentRoutingViewModel()

  return (
    <AppStateHandler appState={incidentsState}>
      <TriageIncidentRoutingView
        incidents={incidentsState.data ?? []}
        isLoading={incidentsState.state === StateType.LOADING}
        error={null}
        selectedIncident={selectedIncident}
        availableHandlers={availableHandlers}
        onSelect={selectIncident}
        onAssign={assignIncident}
        onEscalate={escalateIncident}
        onRefresh={reload}
      />
    </AppStateHandler>
  )
}
