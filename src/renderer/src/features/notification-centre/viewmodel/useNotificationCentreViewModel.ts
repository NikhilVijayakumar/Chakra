import { useEffect, useState } from 'react'
import { useDataState } from 'astra'
import {
  NotificationCentreRepo,
  NotificationPayload,
  NotificationItem
} from '../repo/NotificationCentreRepo'

/**
 * useNotificationCentreViewModel: Domain logic hook
 * - Manages notification state via useDataState
 * - Handles filtering by severity
 * - Manages mark-as-read state
 * - Provides computed properties (filteredItems, unreadCount)
 */
export const useNotificationCentreViewModel = () => {
  const repo = new NotificationCentreRepo()

  // Main notification data state
  const [notificationState, executeLoad] = useDataState<NotificationPayload>()

  // Local UI state
  const [filterSeverity, setFilterSeverity] = useState<string>('all')
  const [isMarkingAsRead, setIsMarkingAsRead] = useState<boolean>(false)

  // Load notifications on mount
  useEffect(() => {
    executeLoad(async () => repo.getNotifications())
  }, [])

  /**
   * Computed: Filter notifications by selected severity
   */
  const filteredItems: NotificationItem[] = notificationState.data?.items
    ? repo.filterBySeverity(notificationState.data.items, filterSeverity)
    : []

  /**
   * Computed: Total unread count
   */
  const unreadCount: number = notificationState.data?.unreadCount ?? 0

  /**
   * Action: Mark a single notification as read and refresh list
   */
  const markAsRead = async (id: string): Promise<void> => {
    setIsMarkingAsRead(true)
    try {
      await repo.markAsRead(id)
      // Refresh notification list after action
      await executeLoad(async () => repo.getNotifications())
    } finally {
      setIsMarkingAsRead(false)
    }
  }

  /**
   * Action: Mark all notifications as read and refresh list
   */
  const markAllAsRead = async (): Promise<void> => {
    setIsMarkingAsRead(true)
    try {
      await repo.markAllAsRead()
      // Refresh notification list after action
      await executeLoad(async () => repo.getNotifications())
    } finally {
      setIsMarkingAsRead(false)
    }
  }

  /**
   * Action: Refresh the notification list
   */
  const reload = async (): Promise<void> => {
    await executeLoad(async () => repo.getNotifications())
  }

  /**
   * Action: Change severity filter
   */
  const setFilter = (severity: string): void => {
    setFilterSeverity(severity)
  }

  return {
    // State
    notificationState,

    // Computed
    filteredItems,
    unreadCount,
    filterSeverity,
    isMarkingAsRead,

    // Actions
    setFilter,
    markAsRead,
    markAllAsRead,
    reload
  }
}
