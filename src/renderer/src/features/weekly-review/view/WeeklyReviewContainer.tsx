import { FC } from 'react'
import { AppStateHandler, StateType } from 'astra'
import { useWeeklyReviewViewModel } from '../viewmodel/useWeeklyReviewViewModel'
import { WeeklyReviewView } from './WeeklyReviewView'

export const WeeklyReviewContainer: FC = () => {
  const { reviewState, reload } = useWeeklyReviewViewModel()

  return (
    <AppStateHandler appState={reviewState}>
      <WeeklyReviewView
        payload={reviewState.data || null}
        isLoading={reviewState.state === StateType.LOADING}
        onRefresh={reload}
      />
    </AppStateHandler>
  )
}
