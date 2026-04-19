import type { ServerResponse } from 'astra'
import { successResponse } from 'prana/services/ipcResponseFactory'
import type { DailyBriefPayload } from '../../daily-brief/repo/DailyBriefRepo'

const EMPTY_DAILY_BRIEF: DailyBriefPayload = {
  date: '',
  topRequests: [],
  functionStatuses: [],
  approvalQueue: [],
  scheduleStatus: {
    enabledJobs: 0,
    totalJobs: 0,
    nextRunAt: null,
    lastRunAt: null
  }
}

export class ReportDailyBriefRepo {
  async getReport(): Promise<ServerResponse<DailyBriefPayload>> {
    try {
      const payload = await window.api.operations.getDailyBrief()
      return successResponse(payload)
    } catch (error) {
      console.error('[ReportDailyBriefRepo] getReport failed', error)
      return successResponse(EMPTY_DAILY_BRIEF)
    }
  }

  async exportReport(format: 'pdf' | 'csv'): Promise<ServerResponse<Blob>> {
    try {
      const mimeType = format === 'pdf' ? 'application/pdf' : 'text/csv'
      const mockData = `Daily brief report exported as ${format}`
      return successResponse(new Blob([mockData], { type: mimeType }))
    } catch (error) {
      console.error('[ReportDailyBriefRepo] exportReport failed', error)
      return successResponse(new Blob([], { type: 'text/plain' }))
    }
  }

  async scheduleReport(cronExpression: string): Promise<ServerResponse<boolean>> {
    try {
      await window.api.operations.createCronProposal({
        id: `daily-brief-report-${Date.now()}`,
        name: 'Daily Brief Report Schedule',
        expression: cronExpression
      })
      return successResponse(true)
    } catch (error) {
      console.error('[ReportDailyBriefRepo] scheduleReport failed', error)
      return successResponse(false)
    }
  }
}
