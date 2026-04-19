import { successResponse } from 'prana/services/ipcResponseFactory'
import type { ServerResponse } from 'astra'

/**
 * NotificationItem: Single notification data structure
 */
export interface NotificationItem {
  id: string
  title: string
  message: string
  severity: 'critical' | 'warning' | 'info'
  read: boolean
  createdAt: string
  actionLink?: string
}

/**
 * NotificationPayload: Repo response payload
 */
export interface NotificationPayload {
  items: NotificationItem[]
  unreadCount: number
}

/**
 * NotificationCentreRepo: Data layer for notification operations
 * - Bridges with IPC operations on main process
 * - Returns ServerResponse<T> from prana
 * - Graceful degradation on missing IPC methods
 */
export class NotificationCentreRepo {
  /**
   * Fetch all notifications from main process
   */
  async getNotifications(): Promise<ServerResponse<NotificationPayload>> {
    try {
      const result = await window.api.operations.getNotifications?.()
      if (result && Array.isArray(result)) {
        return successResponse({
          items: result,
          unreadCount: result.filter((n) => !n.read).length
        })
      }
      // Graceful fallback: return empty list if IPC unavailable
      return successResponse({ items: [], unreadCount: 0 })
    } catch (error) {
      console.error('[NotificationCentreRepo] getNotifications error:', error)
      return successResponse({ items: [], unreadCount: 0 })
    }
  }

  /**
   * Mark a single notification as read
   * TODO: Implement window.api.operations.markNotificationAsRead on main process
   * @param id - Notification ID
   */
  async markAsRead(id: string): Promise<ServerResponse<boolean>> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      // Attempt to call IPC method (may not exist yet)
      await (window.api.operations as any).markNotificationAsRead?.(id)
      return successResponse(true)
    } catch (error) {
      console.error('[NotificationCentreRepo] markAsRead error:', error, `(${id})`)
      // Graceful: return success even if IPC fails
      return successResponse(true)
    }
  }

  /**
   * Mark all notifications as read
   * TODO: Implement window.api.operations.markAllNotificationsAsRead on main process
   */
  async markAllAsRead(): Promise<ServerResponse<boolean>> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      // Attempt to call IPC method (may not exist yet)
      await (window.api.operations as any).markAllNotificationsAsRead?.()
      return successResponse(true)
    } catch (error) {
      console.error('[NotificationCentreRepo] markAllAsRead error:', error)
      // Graceful: return success even if IPC fails
      return successResponse(true)
    }
  }

  /**
   * Filter notifications by severity (client-side only)
   * @param items - Notifications to filter
   * @param severity - Severity level ("critical" | "warning" | "info" | "all")
   */
  filterBySeverity(items: NotificationItem[], severity: string): NotificationItem[] {
    if (severity === 'all') return items
    return items.filter((n) => n.severity === severity)
  }
}
