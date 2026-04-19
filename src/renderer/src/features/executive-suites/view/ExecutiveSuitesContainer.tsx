import { FC } from 'react'
import { AppStateHandler } from 'astra'
import { useOnboardingActionGate } from 'prana/ui/hooks/useOnboardingActionGate'
import { ExecutiveSuitesView } from './ExecutiveSuitesView'
import { useExecutiveSuitesViewModel } from '../viewmodel/useExecutiveSuitesViewModel'

const EXECUTION_REQUIRED_PHASES = [
  'company-core',
  'product-context',
  'global-assets',
  'global-guardrails',
  'agent-profile-persona',
  'agent-workflows',
  'infrastructure-finalization'
]

export const ExecutiveSuitesContainer: FC = () => {
  const {
    suiteState,
    reload,
    trendOutput,
    runTrendIntelligence,
    isRunningTrendIntelligence,
    errorMessage
  } = useExecutiveSuitesViewModel()
  const actionGate = useOnboardingActionGate(EXECUTION_REQUIRED_PHASES)

  return (
    <AppStateHandler appState={suiteState}>
      <ExecutiveSuitesView
        snapshot={suiteState.data?.snapshot ?? null}
        trendOutput={trendOutput}
        onRunTrendIntelligence={runTrendIntelligence}
        onRefresh={reload}
        isRunningTrendIntelligence={isRunningTrendIntelligence}
        errorMessage={errorMessage}
        actionGate={actionGate}
      />
    </AppStateHandler>
  )
}
