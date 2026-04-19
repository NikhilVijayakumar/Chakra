import type { ServerResponse } from 'astra'
import { successResponse } from 'prana/services/ipcResponseFactory'
import type { FundingDigestPayload } from '../../funding-digest/repo/FundingRepo'

const EMPTY_FUNDING_DIGEST: FundingDigestPayload = {
  runwayMonths: 0,
  burnRate: '',
  cashInBank: '',
  metrics: [],
  leads: []
}

export class ReportFundingDigestRepo {
  async getReport(): Promise<ServerResponse<FundingDigestPayload>> {
    try {
      const payload = await window.api.operations.getFundingDigest()
      return successResponse(payload)
    } catch (error) {
      console.error('[ReportFundingDigestRepo] getReport failed', error)
      return successResponse(EMPTY_FUNDING_DIGEST)
    }
  }

  async exportReport(format: 'pdf' | 'csv'): Promise<ServerResponse<Blob>> {
    try {
      const mimeType = format === 'pdf' ? 'application/pdf' : 'text/csv'
      const mockData = `Funding digest report exported as ${format}`
      return successResponse(new Blob([mockData], { type: mimeType }))
    } catch (error) {
      console.error('[ReportFundingDigestRepo] exportReport failed', error)
      return successResponse(new Blob([], { type: 'text/plain' }))
    }
  }

  async scheduleReport(cronExpression: string): Promise<ServerResponse<boolean>> {
    try {
      await window.api.operations.createCronProposal({
        id: `funding-digest-report-${Date.now()}`,
        name: 'Funding Digest Report Schedule',
        expression: cronExpression
      })
      return successResponse(true)
    } catch (error) {
      console.error('[ReportFundingDigestRepo] scheduleReport failed', error)
      return successResponse(false)
    }
  }
}
