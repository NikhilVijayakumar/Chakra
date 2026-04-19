import { successResponse } from 'prana/services/ipcResponseFactory'
import type { ServerResponse } from 'astra'

export interface KpiDefinition {
  uid: string
  name: string
  description: string
  unit: string
  target: string
  value: string
  formula?: string
  goalMapping: string
  frequencyOfCheck?: 'real-time' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'on-demand'
  responsibleAgentRole?: string
  thresholds?: { critical?: string; warning?: string; optimal?: string }
}

export type SyncStatus = 'DRAFT' | 'NEW' | 'SYNCED' | 'IN_VAULT'

export interface KpiWithSyncStatus {
  kpi: KpiDefinition
  syncStatus: SyncStatus
  lastSyncedAt?: string
}

export type KpiWithStatus = KpiWithSyncStatus

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

export class KpisRepo {
  async getKpis(companyId: string): Promise<ServerResponse<KpiDefinition[]>> {
    const payload = await window.api.dharma.getKpis(companyId)
    return successResponse(payload as unknown as KpiDefinition[])
  }

  async syncKpiToCache(companyId: string, kpi: KpiDefinition): Promise<ServerResponse<SyncResult>> {
    const payload = await window.api.dharma.syncKpiToCache(
      companyId,
      kpi as unknown as Parameters<typeof window.api.dharma.syncKpiToCache>[1]
    )
    return successResponse(payload)
  }

  async saveKpiToVault(companyId: string, kpi: KpiDefinition): Promise<ServerResponse<SaveResult>> {
    const payload = await window.api.dharma.saveKpiToVault(
      companyId,
      kpi as unknown as Parameters<typeof window.api.dharma.saveKpiToVault>[1]
    )
    return successResponse(payload)
  }

  async getSyncStatus(companyId: string): Promise<ServerResponse<Record<string, SyncStatus>>> {
    const payload = await window.api.dharma.getKpisSyncStatus(companyId)
    return successResponse(payload)
  }
}
