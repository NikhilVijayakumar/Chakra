import { FC } from 'react'
import { AppStateHandler, StateType } from 'astra'
import { useFundingDigestViewModel } from '../viewmodel/useFundingDigestViewModel'
import { FundingDigestView } from './FundingDigestView'

export const FundingDigestContainer: FC = () => {
  const { digestState, reload } = useFundingDigestViewModel()

  return (
    <AppStateHandler appState={digestState}>
      <FundingDigestView
        payload={digestState.data || null}
        isLoading={digestState.state === StateType.LOADING}
        onRefresh={reload}
      />
    </AppStateHandler>
  )
}
