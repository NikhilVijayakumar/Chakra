import { successResponse } from 'prana/services/ipcResponseFactory'
import type { ServerResponse } from 'astra'

export interface WorkflowDefinition {
  id: string
  agent_id: string
  trigger: string
  workflow_mode?: 'single-agent' | 'global-collaborative'
  preConditions?: Array<{ condition: string; description: string }>
  logicSequence?: Record<string, Record<string, string>>
  steps?: string[]
  postConditions?: Array<{ effect: string; description: string }>
  dependencies: {
    required_skills: string[]
    required_kpis: string[]
    data_inputs?: string[]
    required_agents?: string[]
    protocols?: string[]
  }
  collaborators?: Array<{
    agent_id: string
    role: string
    responsibility: string
    required?: boolean
  }>
  expected_output: string
  metadata?: {
    version?: string
    status?: 'draft' | 'active' | 'deprecated'
  }
}

export type SyncStatus = 'DRAFT' | 'NEW' | 'SYNCED' | 'IN_VAULT'

export interface WorkflowWithSyncStatus {
  workflow: WorkflowDefinition
  syncStatus: SyncStatus
  lastSyncedAt?: string
}

export type WorkflowWithStatus = WorkflowWithSyncStatus

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

export class WorkflowsRepo {
  async getWorkflows(companyId: string): Promise<ServerResponse<WorkflowDefinition[]>> {
    const payload = await window.api.dharma.getWorkflows(companyId)
    return successResponse(payload as unknown as WorkflowDefinition[])
  }

  async syncWorkflowToCache(
    companyId: string,
    workflow: WorkflowDefinition
  ): Promise<ServerResponse<SyncResult>> {
    const payload = await window.api.dharma.syncWorkflowToCache(
      companyId,
      workflow as unknown as Parameters<typeof window.api.dharma.syncWorkflowToCache>[1]
    )
    return successResponse(payload)
  }

  async saveWorkflowToVault(
    companyId: string,
    workflow: WorkflowDefinition
  ): Promise<ServerResponse<SaveResult>> {
    const payload = await window.api.dharma.saveWorkflowToVault(
      companyId,
      workflow as unknown as Parameters<typeof window.api.dharma.saveWorkflowToVault>[1]
    )
    return successResponse(payload)
  }

  async getSyncStatus(companyId: string): Promise<ServerResponse<Record<string, SyncStatus>>> {
    const payload = await window.api.dharma.getWorkflowsSyncStatus(companyId)
    return successResponse(payload)
  }
}
