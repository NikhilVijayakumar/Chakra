import { successResponse } from 'prana/services/ipcResponseFactory'
import type { ServerResponse } from 'astra'

export interface DataInputDefinition {
  uid: string
  name: string
  description: string
  schemaType:
    | 'tabular'
    | 'event-stream'
    | 'document'
    | 'timeseries'
    | 'identity-protocol'
    | 'intelligence-protocol'
    | 'manifest-schema'
    | 'audit-trail'
  sourceType?:
    | 'csv'
    | 'json'
    | 'jsonl'
    | 'yaml'
    | 'sql-database'
    | 'api-endpoint'
    | 'vault'
    | 'git-repository'
  sourceLocation?: string
  requiredFields: Array<
    string | { name: string; type?: string; required?: boolean; description?: string }
  >
  sampleSource: string
  updateFrequency?: 'real-time' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'on-demand'
  responsibleAgent?: string
  privacyClassification?: 'public' | 'internal' | 'confidential' | 'restricted'
}

export type SyncStatus = 'DRAFT' | 'NEW' | 'SYNCED' | 'IN_VAULT'

export interface DataInputWithSyncStatus {
  dataInput: DataInputDefinition
  syncStatus: SyncStatus
  lastSyncedAt?: string
}

export type DataInputWithStatus = DataInputWithSyncStatus

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

export class DataInputsRepo {
  async getDataInputs(companyId: string): Promise<ServerResponse<DataInputDefinition[]>> {
    const payload = await window.api.dharma.getDataInputs(companyId)
    return successResponse(payload as unknown as DataInputDefinition[])
  }

  async syncDataInputToCache(
    companyId: string,
    dataInput: DataInputDefinition
  ): Promise<ServerResponse<SyncResult>> {
    const payload = await window.api.dharma.syncDataInputToCache(
      companyId,
      dataInput as unknown as Parameters<typeof window.api.dharma.syncDataInputToCache>[1]
    )
    return successResponse(payload)
  }

  async saveDataInputToVault(
    companyId: string,
    dataInput: DataInputDefinition
  ): Promise<ServerResponse<SaveResult>> {
    const payload = await window.api.dharma.saveDataInputToVault(
      companyId,
      dataInput as unknown as Parameters<typeof window.api.dharma.saveDataInputToVault>[1]
    )
    return successResponse(payload)
  }

  async getSyncStatus(companyId: string): Promise<ServerResponse<Record<string, SyncStatus>>> {
    const payload = await window.api.dharma.getDataInputsSyncStatus(companyId)
    return successResponse(payload)
  }
}
