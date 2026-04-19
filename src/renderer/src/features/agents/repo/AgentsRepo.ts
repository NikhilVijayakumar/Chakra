import { successResponse } from 'prana/services/ipcResponseFactory'
import type { ServerResponse } from 'astra'

export interface AgentTemplate {
  name: string
  role: string
  backstory: string
  goal: string
  core_objective: string
  individual_vision: string
  role_non_negotiable_requirements: string[]
  objectives_long_term: string[]
  personality_traits: string[]
  interaction_style: string
  constraints: string[]
  skills: string[]
  kpis: string[]
  data?: string[]
  data_requirements: string[]
  protocols: string[]
  workflows?: string[]
}

export interface AgentDefinition extends AgentTemplate {
  uid: string
}

export type SyncStatus = 'DRAFT' | 'NEW' | 'SYNCED' | 'IN_VAULT'

export interface AgentWithSyncStatus {
  agent: AgentDefinition
  syncStatus: SyncStatus
  lastSyncedAt?: string
}

export type AgentWithStatus = AgentWithSyncStatus

export interface AgentsCatalog {
  companyId: string
  entries: AgentDefinition[]
}

export interface SaveResult {
  success: boolean
  entityId: string
  vaultPath?: string
  error?: string
}

export interface SyncResult {
  success: boolean
  entityId: string
  cachePath?: string
  error?: string
}

export class AgentsRepo {
  async getAgents(companyId: string): Promise<ServerResponse<AgentsCatalog>> {
    const payload = await window.api.dharma.getAgents(companyId)
    return successResponse(payload)
  }

  async getAgent(companyId: string, agentPath: string): Promise<ServerResponse<AgentDefinition>> {
    const payload = await window.api.dharma.getAgent(companyId, agentPath)
    return successResponse(payload)
  }

  async syncAgentToCache(
    companyId: string,
    agent: AgentDefinition
  ): Promise<ServerResponse<SyncResult>> {
    const payload = await window.api.dharma.syncAgentToCache(companyId, agent)
    return successResponse(payload)
  }

  async saveAgentToVault(
    companyId: string,
    agent: AgentDefinition
  ): Promise<ServerResponse<SaveResult>> {
    const payload = await window.api.dharma.saveAgentToVault(companyId, agent)
    return successResponse(payload)
  }

  async getSyncStatus(companyId: string): Promise<ServerResponse<Record<string, SyncStatus>>> {
    const payload = await window.api.dharma.getAgentsSyncStatus(companyId)
    return successResponse(payload)
  }
}
