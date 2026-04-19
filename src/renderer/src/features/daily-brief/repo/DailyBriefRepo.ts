import { successResponse } from 'prana/services/ipcResponseFactory'
import type { ServerResponse } from 'astra'

export interface TopRequest {
  id: string
  sourceAgent: string
  summary: string
  classification: 'CRITICAL' | 'URGENT' | 'IMPORTANT'
}

export interface FunctionStatus {
  agentName: string
  domain: string
  health: 'ok' | 'warning' | 'critical'
  statusLine: string
}

export interface ApprovalItem {
  id: string
  source: string
  description: string
  expiresInHours: number
}

export interface DailyBriefPayload {
  date: string
  topRequests: TopRequest[]
  functionStatuses: FunctionStatus[]
  approvalQueue: ApprovalItem[]
  scheduleStatus: {
    enabledJobs: number
    totalJobs: number
    nextRunAt: string | null
    lastRunAt: string | null
  }
}

export class DailyBriefRepo {
  async getDailyBrief(): Promise<ServerResponse<DailyBriefPayload>> {
    const payload = await window.api.operations.getDailyBrief()
    return successResponse(payload)
  }
}
