import { successResponse } from 'prana/services/ipcResponseFactory'
import type { ServerResponse } from 'astra'

export interface NotificationItem {
  id: string
  timestamp: string
  source: string
  severity: 'CRITICAL' | 'WARNING' | 'INFO'
  message: string
  read: boolean
}

export interface NotificationPayload {
  unreadCount: number
  items: NotificationItem[]
}

export class NotificationRepo {
  async getNotifications(): Promise<ServerResponse<NotificationPayload>> {
    const payload = await window.api.operations.getNotifications()
    return successResponse(payload)
  }
}
