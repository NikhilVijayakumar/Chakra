import { successResponse } from 'prana/services/ipcResponseFactory'
import type { ServerResponse } from 'astra'

export interface AgentReport {
  agent: string
  domain: string
  slips: string[]
  improvements: string[]
  risks: string[]
  customMetricLabel?: string
  customMetricValue?: string
}

export interface WeeklyReviewPayload {
  weekEnding: string
  reports: AgentReport[]
  scheduleStatus: {
    enabledJobs: number
    totalJobs: number
    successfulJobs: number
    failedJobs: number
    lastTickAt: string | null
  }
}

export class WeeklyReviewRepo {
  async getWeeklyReview(): Promise<ServerResponse<WeeklyReviewPayload>> {
    const payload = await window.api.operations.getWeeklyReview()
    return successResponse(payload)
  }
}
