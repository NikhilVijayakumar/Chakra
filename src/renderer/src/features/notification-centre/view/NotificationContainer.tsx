import { FC } from 'react'
import { AppStateHandler, StateType } from 'astra'
import { useNotificationViewModel } from '../viewmodel/useNotificationViewModel'
import { NotificationView } from './NotificationView'

export const NotificationContainer: FC = () => {
  const { notifState, reload } = useNotificationViewModel()

  return (
    <AppStateHandler appState={notifState}>
      <NotificationView
        payload={notifState.data || null}
        isLoading={notifState.state === StateType.LOADING}
        onRefresh={reload}
      />
    </AppStateHandler>
  )
}
