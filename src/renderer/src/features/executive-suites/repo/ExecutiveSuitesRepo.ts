import { successResponse } from 'prana/services/ipcResponseFactory'
import type { ServerResponse } from 'astra'

export interface AdministrationIntegrationSnapshotPayload {
  mode: 'template-only' | 'adapter-ready'
  configPaths: {
    integrationConfig: string
    googleSheetsMapping: string
    staffRegistry: string
    feedbackResponses: string
    feedbackEvaluation: string
    kpiSignals?: string
    kpiHappinessEvaluation?: string
    escalationOutput?: string
    socialTrendSignals?: string
    socialTrendPolicyImpact?: string
    socialTrendEscalations?: string
  }
  providers: {
    googleSheets: {
      configured: boolean
      spreadsheetId: string
      syncMode: string
      frequency: string
    }
    googleForms: {
      configured: boolean
      ingestionEnabled: boolean
    }
  }
  staffRegistry: {
    rowCount: number
    headers: string[]
  }
  feedback: {
    responseCount: number
  }
  lastSync: {
    staffRegistry: {
      startedAt: string
      completedAt: string
      source: string
      recordsRead: number
      recordsApplied: number
      warnings: string[]
      mode: 'template-only' | 'adapter-ready'
    } | null
    feedback: {
      startedAt: string
      completedAt: string
      source: string
      recordsRead: number
      recordsApplied: number
      warnings: string[]
      mode: 'template-only' | 'adapter-ready'
    } | null
    evaluation?: {
      startedAt: string
      completedAt: string
      source: string
      recordsRead: number
      recordsApplied: number
      warnings: string[]
      mode: 'template-only' | 'adapter-ready'
    } | null
    trends?: {
      startedAt: string
      completedAt: string
      source: string
      recordsRead: number
      recordsApplied: number
      warnings: string[]
      mode: 'template-only' | 'adapter-ready'
    } | null
  }
}

export interface PolicyImpactRecommendationPayload {
  topic: string
  risk: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  rationale: string
  recommendedPolicyArea: string
  recommendedActions: string[]
  escalationRequired: boolean
}

export interface SocialTrendIntelligenceOutputPayload {
  generatedAt: string
  source: string
  summary: {
    trendCount: number
    policySignals: number
    escalations: number
  }
  recommendations: PolicyImpactRecommendationPayload[]
}

export interface ExecutiveSuitesPayload {
  snapshot: AdministrationIntegrationSnapshotPayload
}

export class ExecutiveSuitesRepo {
  async getDirectorOfficeSnapshot(): Promise<ServerResponse<ExecutiveSuitesPayload>> {
    const snapshot = await window.api.operations.getAdministrationIntegrationSnapshot()
    return successResponse({ snapshot } as ExecutiveSuitesPayload)
  }

  async runSocialTrendIntelligence(): Promise<
    ServerResponse<SocialTrendIntelligenceOutputPayload>
  > {
    const output = await window.api.operations.runAdministrationSocialTrendIntelligence()
    return successResponse(output, 'Completed')
  }
}
