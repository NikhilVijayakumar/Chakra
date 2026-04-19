import { FC } from 'react'
import { AppStateHandler, StateType } from 'astra'
import { useTriageViewModel } from '../viewmodel/useTriageViewModel'
import { TriageView } from './TriageView'

export const TriageContainer: FC = () => {
  const {
    state,
    memoryState,
    memoryQuery,
    setMemoryQuery,
    runTriageAction,
    searchRelatedMemory,
    isApplyingAction
  } = useTriageViewModel()

  return (
    <AppStateHandler appState={state}>
      <TriageView
        items={state.data}
        memoryHits={memoryState.data || null}
        memoryQuery={memoryQuery}
        isMemorySearching={memoryState.state === StateType.LOADING}
        onMemoryQueryChange={setMemoryQuery}
        onSearchMemory={searchRelatedMemory}
        onAction={runTriageAction}
        isApplyingAction={isApplyingAction}
      />
    </AppStateHandler>
  )
}
