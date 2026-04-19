import { successResponse } from 'prana/services/ipcResponseFactory'
import type { ServerResponse } from 'astra'

export interface FundingLead {
  id: string
  name: string
  firm: string
  stage: 'Contacted' | 'Pitch Scheduled' | 'Due Diligence' | 'Term Sheet'
  confidence: number
}

export interface FinancialMetric {
  label: string
  value: string
  trend: 'up' | 'down' | 'neutral'
  trendValue: string
}

export interface FundingDigestPayload {
  runwayMonths: number
  burnRate: string
  cashInBank: string
  metrics: FinancialMetric[]
  leads: FundingLead[]
}

export class FundingRepo {
  async getFundingDigest(): Promise<ServerResponse<FundingDigestPayload>> {
    const payload = await window.api.operations.getFundingDigest()
    return successResponse(payload)
  }
}
