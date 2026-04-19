import type { ServerResponse } from 'astra'
import { successResponse } from 'prana/services/ipcResponseFactory'
import type { WeeklyReviewPayload } from '../../weekly-review/repo/WeeklyReviewRepo'

const EMPTY_WEEKLY_REVIEW: WeeklyReviewPayload = {
  weekEnding: '',
  reports: [],
  scheduleStatus: {
    enabledJobs: 0,
    totalJobs: 0,
    successfulJobs: 0,
    failedJobs: 0,
    lastTickAt: null
  }
}

export class ReportWeeklyReviewRepo {
  async getReport(): Promise<ServerResponse<WeeklyReviewPayload>> {
    try {
      const payload = await window.api.operations.getWeeklyReview()
      return successResponse(payload)
    } catch (error) {
      console.error('[ReportWeeklyReviewRepo] getReport failed', error)
      return successResponse(EMPTY_WEEKLY_REVIEW)
    }
  }

  async exportReport(format: 'pdf' | 'csv'): Promise<ServerResponse<Blob>> {
    try {
      const mimeType = format === 'pdf' ? 'application/pdf' : 'text/csv'
      const mockData = `Weekly review report exported as ${format}`
      return successResponse(new Blob([mockData], { type: mimeType }))
    } catch (error) {
      console.error('[ReportWeeklyReviewRepo] exportReport failed', error)
      return successResponse(new Blob([], { type: 'text/plain' }))
    }
  }

  async scheduleReport(cronExpression: string): Promise<ServerResponse<boolean>> {
    try {
      await window.api.operations.createCronProposal({
        id: `weekly-review-report-${Date.now()}`,
        name: 'Weekly Review Report Schedule',
        expression: cronExpression
      })
      return successResponse(true)
    } catch (error) {
      console.error('[ReportWeeklyReviewRepo] scheduleReport failed', error)
      return successResponse(false)
    }
  }
}
