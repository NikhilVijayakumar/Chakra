import { successResponse } from 'prana/services/ipcResponseFactory'
import type { ServerResponse } from 'astra'

export interface CompanyIdentity {
  name: string
  type: string
  foundation: string
  philosophy: string[]
  bavans_dual_framework?: {
    description: string
    structure: Array<{
      letter: string
      person: string
      value: string
      meaning: string
    }>
    decision_principle: string
  }
}

export interface CompanyContext {
  stage: string
  constraints: string[]
  operational_environment: string[]
}

export interface CompanyMissionAlignment {
  primary_mission: string
  secondary_mission: string
  ai_role: string[]
}

export interface CompanyGovernance {
  role_definition: {
    ai: string
    human: string
  }
  value_boundaries: {
    ai_can_assist: string[]
    human_only_control: string[]
  }
  allowed_ai_functions: string[]
  restricted_ai_functions: string[]
  persona_governance: string[]
}

export interface CompanyRiskFramework {
  required_in_every_decision: string[]
  risk_response_principles: string[]
}

export interface CompanyAuditability {
  requirements: string[]
  purpose: string[]
}

export interface CompanyCore {
  identity: CompanyIdentity
  vision: string
  context: CompanyContext
  mission_alignment: CompanyMissionAlignment
  core_values: string[]
  creative_control_layer?: {
    bavans_value_enforcement: string[]
    validation_rule: string
  }
  ai_governance_model: CompanyGovernance
  global_non_negotiables: string[]
  operational_rules?: {
    content_creation?: string[]
    content_scaling?: string[]
    audio_and_voice?: string[]
    educational_integrity?: string[]
  }
  risk_framework: CompanyRiskFramework
  auditability: CompanyAuditability
  explicit_exclusions: string[]
  long_term_intent: {
    goal: string
    direction: string[]
  }
  website?: string[]
  updatedAt?: string
}

export interface CompanyData {
  companyId: string
  core: CompanyCore
  branding?: {
    theme: string
    typography: string
  }
}

export interface SaveResult {
  success: boolean
  entityId: string
  vaultPath?: string
  error?: string
}

interface DharmaCompanyRegistry {
  id: string
  metadata: {
    companyName: string
    companyType: string
    foundation: string
    philosophy: string
    vision: string
    coreValues: string[]
    aiGovernance: {
      roles: Record<string, { name: string; description: string; responsibilities: string[] }>
      boundaries: string[]
    }
    globalNonNegotiables: string[]
    website?: { name: string; url: string }
  }
}

const toCompanyData = (registry: DharmaCompanyRegistry): CompanyData => {
  const aiRole = registry.metadata.aiGovernance.roles.ai?.description ?? 'AI assistant'
  const humanRole = registry.metadata.aiGovernance.roles.human?.description ?? 'Human owner'

  return {
    companyId: registry.id,
    core: {
      identity: {
        name: registry.metadata.companyName,
        type: registry.metadata.companyType,
        foundation: registry.metadata.foundation,
        philosophy: registry.metadata.philosophy
          .split(/[\n,]/)
          .map((item) => item.trim())
          .filter(Boolean)
      },
      vision: registry.metadata.vision,
      context: {
        stage: 'ACTIVE',
        constraints: [],
        operational_environment: []
      },
      mission_alignment: {
        primary_mission: registry.metadata.vision,
        secondary_mission: '',
        ai_role: [aiRole]
      },
      core_values: registry.metadata.coreValues,
      ai_governance_model: {
        role_definition: {
          ai: aiRole,
          human: humanRole
        },
        value_boundaries: {
          ai_can_assist: registry.metadata.aiGovernance.boundaries,
          human_only_control: []
        },
        allowed_ai_functions: [],
        restricted_ai_functions: [],
        persona_governance: []
      },
      global_non_negotiables: registry.metadata.globalNonNegotiables,
      risk_framework: {
        required_in_every_decision: [],
        risk_response_principles: []
      },
      auditability: {
        requirements: [],
        purpose: []
      },
      explicit_exclusions: [],
      long_term_intent: {
        goal: registry.metadata.vision,
        direction: []
      },
      website: registry.metadata.website?.url ? [registry.metadata.website.url] : []
    }
  }
}

export class CompanyRepo {
  async getCompany(companyId: string): Promise<ServerResponse<CompanyData>> {
    const payload = (await window.api.dharma.getCompany(companyId)) as DharmaCompanyRegistry
    const response = successResponse(payload)
    if (response.isSuccess && response.data) {
      return {
        ...response,
        data: toCompanyData(response.data as DharmaCompanyRegistry)
      } as ServerResponse<CompanyData>
    }

    return response as unknown as ServerResponse<CompanyData>
  }

  async saveCompany(companyId: string, data: CompanyData): Promise<ServerResponse<SaveResult>> {
    void companyId
    void data
    throw new Error('Save company is not supported by the current Dharma preload contract')
  }
}
