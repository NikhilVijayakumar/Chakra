import type { FC } from 'react'
import { AppStateHandler } from 'astra'
import { TriageIncidentResolutionView } from './TriageIncidentResolutionView'
import { useTriageIncidentResolutionViewModel } from '../viewmodel/useTriageIncidentResolutionViewModel'

export const TriageIncidentResolutionContainer: FC = () => {
  const {
    state,
    activeTab,
    selectedIncident,
    resolutionNotes,
    incidents,
    setActiveTab,
    setResolutionNotes,
    selectIncident,
    resolveIncident,
    reopenIncident,
    reload
  } = useTriageIncidentResolutionViewModel()

  return (
    <AppStateHandler appState={state}>
      <TriageIncidentResolutionView
        inProgressCount={state.data?.inProgress.length ?? 0}
        resolvedCount={state.data?.resolved.length ?? 0}
        activeTab={activeTab}
        incidents={incidents}
        selectedIncident={selectedIncident}
        resolutionNotes={resolutionNotes}
        onTabChange={setActiveTab}
        onSelect={selectIncident}
        onResolve={resolveIncident}
        onReopen={reopenIncident}
        onNotesChange={setResolutionNotes}
        onRefresh={reload}
      />
    </AppStateHandler>
  )
}
