import { successResponse } from 'prana/services/ipcResponseFactory'
import type { ServerResponse } from 'astra'

export interface ProtocolDoc {
  id: string
  title: string
  tags: string[]
  format: 'yaml' | 'markdown'
  content: string
  sourceFile: string
  rules: string[]
}

export type SyncStatus = 'DRAFT' | 'NEW' | 'SYNCED' | 'IN_VAULT'

export interface ProtocolWithSyncStatus {
  protocol: ProtocolDoc
  syncStatus: SyncStatus
  lastSyncedAt?: string
}

export type ProtocolWithStatus = ProtocolWithSyncStatus

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

export class ProtocolsRepo {
  async getProtocols(companyId: string): Promise<ServerResponse<ProtocolDoc[]>> {
    const payload = await window.api.dharma.getProtocols(companyId)
    return successResponse(payload as unknown as ProtocolDoc[])
  }

  async syncProtocolToCache(
    companyId: string,
    protocol: ProtocolDoc
  ): Promise<ServerResponse<SyncResult>> {
    const payload = await window.api.dharma.syncProtocolToCache(
      companyId,
      protocol as unknown as Parameters<typeof window.api.dharma.syncProtocolToCache>[1]
    )
    return successResponse(payload)
  }

  async saveProtocolToVault(
    companyId: string,
    protocol: ProtocolDoc
  ): Promise<ServerResponse<SaveResult>> {
    const payload = await window.api.dharma.saveProtocolToVault(
      companyId,
      protocol as unknown as Parameters<typeof window.api.dharma.saveProtocolToVault>[1]
    )
    return successResponse(payload)
  }

  async getSyncStatus(companyId: string): Promise<ServerResponse<Record<string, SyncStatus>>> {
    const payload = await window.api.dharma.getProtocolsSyncStatus(companyId)
    return successResponse(payload)
  }
}
