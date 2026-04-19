import { useEffect } from 'react'
import { useDataState } from 'astra'
import { NotificationRepo, NotificationPayload } from '../repo/NotificationRepo'

export const useNotificationViewModel = () => {
  const repo = new NotificationRepo()
  const [notifState, executeLoad] = useDataState<NotificationPayload>()

  useEffect(() => {
    executeLoad(() => repo.getNotifications())
  }, [])

  return {
    notifState,
    reload: () => executeLoad(() => repo.getNotifications())
  }
}
