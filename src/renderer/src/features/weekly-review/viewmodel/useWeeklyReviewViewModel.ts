import { useEffect } from 'react'
import { useDataState } from 'astra'
import { WeeklyReviewRepo, WeeklyReviewPayload } from '../repo/WeeklyReviewRepo'

export const useWeeklyReviewViewModel = () => {
  const repo = new WeeklyReviewRepo()
  const [reviewState, executeLoad] = useDataState<WeeklyReviewPayload>()

  useEffect(() => {
    executeLoad(() => repo.getWeeklyReview())
  }, [])

  return {
    reviewState,
    reload: () => executeLoad(() => repo.getWeeklyReview())
  }
}
