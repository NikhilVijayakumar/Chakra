import { successResponse } from 'prana/services/ipcResponseFactory'
import type { ServerResponse } from 'astra'

export interface SkillDoc {
  id: string
  title: string
  tags: string[]
  content: string
  sourceFile: string
}

export type SyncStatus = 'DRAFT' | 'NEW' | 'SYNCED' | 'IN_VAULT'

export interface SkillWithSyncStatus {
  skill: SkillDoc
  syncStatus: SyncStatus
  lastSyncedAt?: string
}

export type SkillWithStatus = SkillWithSyncStatus

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

export class SkillsRepo {
  async getSkills(companyId: string): Promise<ServerResponse<SkillDoc[]>> {
    const payload = await window.api.dharma.getSkills(companyId)
    return successResponse(payload as unknown as SkillDoc[])
  }

  async syncSkillToCache(companyId: string, skill: SkillDoc): Promise<ServerResponse<SyncResult>> {
    const payload = await window.api.dharma.syncSkillToCache(
      companyId,
      skill as unknown as Parameters<typeof window.api.dharma.syncSkillToCache>[1]
    )
    return successResponse(payload)
  }

  async saveSkillToVault(companyId: string, skill: SkillDoc): Promise<ServerResponse<SaveResult>> {
    const payload = await window.api.dharma.saveSkillToVault(
      companyId,
      skill as unknown as Parameters<typeof window.api.dharma.saveSkillToVault>[1]
    )
    return successResponse(payload)
  }

  async getSyncStatus(companyId: string): Promise<ServerResponse<Record<string, SyncStatus>>> {
    const payload = await window.api.dharma.getSkillsSyncStatus(companyId)
    return successResponse(payload)
  }
}
