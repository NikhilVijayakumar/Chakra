import React from 'react'
import { AppStateHandler, StateType } from 'astra'
import NotificationCentreView from './NotificationCentreView'
import { useNotificationCentreViewModel } from '../viewmodel/useNotificationCentreViewModel'

/**
 * NotificationCentreContainer: Orchestration component
 * - Loads ViewModel
 * - Wraps with AppStateHandler for loading/error states
 * - Passes ViewModel state and methods to View
 * - Route: /notification-centre
 */
export const NotificationCentreContainer: React.FC = () => {
  const {
    notificationState,
    filteredItems,
    unreadCount,
    filterSeverity,
    isMarkingAsRead,
    setFilter,
    markAsRead,
    markAllAsRead,
    reload
  } = useNotificationCentreViewModel()

  return (
    <AppStateHandler appState={notificationState}>
      <NotificationCentreView
        items={filteredItems}
        unreadCount={unreadCount}
        filterSeverity={filterSeverity}
        isMarkingAsRead={isMarkingAsRead}
        isLoading={notificationState.state === StateType.LOADING}
        error={null}
        onFilterChange={setFilter}
        onMarkAsRead={markAsRead}
        onMarkAllAsRead={markAllAsRead}
        onRefresh={reload}
      />
    </AppStateHandler>
  )
}

export default NotificationCentreContainer
