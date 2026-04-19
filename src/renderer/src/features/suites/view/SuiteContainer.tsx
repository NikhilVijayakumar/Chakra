import { FC } from 'react'
import { AppStateHandler } from 'astra'
import { useOnboardingActionGate } from 'prana/ui/hooks/useOnboardingActionGate'
import { useSuiteViewModel } from '../viewmodel/useSuiteViewModel'
import { SuiteView } from './SuiteView'

const EXECUTION_REQUIRED_PHASES = [
  'company-core',
  'product-context',
  'global-assets',
  'global-guardrails',
  'agent-profile-persona',
  'agent-workflows',
  'infrastructure-finalization'
]

export const SuiteContainer: FC = () => {
  const { state, runSkill, executionLog } = useSuiteViewModel()
  const actionGate = useOnboardingActionGate(EXECUTION_REQUIRED_PHASES)

  return (
    <AppStateHandler appState={state}>
      <SuiteView
        agents={state.data?.agents ?? null}
        skills={state.data?.skills ?? []}
        onRunSkill={runSkill}
        executionLog={executionLog}
        actionGate={actionGate}
      />
    </AppStateHandler>
  )
}
