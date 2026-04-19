import type { FC } from 'react'
import { AppStateHandler, StateType } from 'astra'
import { KpiVerificationCronView } from './KpiVerificationCronView'
import { useKpiVerificationCronViewModel } from '../viewmodel/useKpiVerificationCronViewModel'

export const KpiVerificationCronContainer: FC = () => {
  const {
    cronState,
    newCronExpression,
    newCronName,
    isCreating,
    formError,
    setCronExpression,
    setCronName,
    createCron,
    pauseCron,
    resumeCron,
    runNow,
    deleteCron,
    reload
  } = useKpiVerificationCronViewModel()

  return (
    <AppStateHandler appState={cronState}>
      <KpiVerificationCronView
        jobs={cronState.data ?? []}
        isLoading={cronState.state === StateType.LOADING}
        isCreating={isCreating}
        error={formError}
        newCronName={newCronName}
        newCronExpression={newCronExpression}
        onNameChange={setCronName}
        onExpressionChange={setCronExpression}
        onCreateCron={createCron}
        onPauseCron={pauseCron}
        onResumeCron={resumeCron}
        onRunNow={runNow}
        onDeleteCron={deleteCron}
        onRefresh={reload}
      />
    </AppStateHandler>
  )
}
