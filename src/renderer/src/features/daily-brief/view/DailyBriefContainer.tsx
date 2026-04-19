import { FC } from 'react'
import { AppStateHandler, StateType } from 'astra'
import { useOnboardingActionGate } from 'prana/ui/hooks/useOnboardingActionGate'
import { useDailyBriefViewModel } from '../viewmodel/useDailyBriefViewModel'
import { DailyBriefView } from './DailyBriefView'

const EXECUTION_REQUIRED_PHASES = [
  'company-core',
  'product-context',
  'global-assets',
  'global-guardrails',
  'agent-profile-persona',
  'agent-workflows',
  'infrastructure-finalization'
]

export const DailyBriefContainer: FC = () => {
  const { briefState, reload } = useDailyBriefViewModel()
  const actionGate = useOnboardingActionGate(EXECUTION_REQUIRED_PHASES)

  return (
    <AppStateHandler appState={briefState}>
      <DailyBriefView
        payload={briefState.data || null}
        isLoading={briefState.state === StateType.LOADING}
        onRefresh={reload}
        actionGate={actionGate}
      />
    </AppStateHandler>
  )
}
