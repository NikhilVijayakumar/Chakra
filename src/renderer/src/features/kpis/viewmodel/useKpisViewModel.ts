import { useState, useEffect, useCallback } from 'react'
import { KpisRepo, type KpiDefinition, type SyncStatus } from '../repo/KpisRepo'

const repo = new KpisRepo()

export interface KpiWithStatus {
  kpi: KpiDefinition
  syncStatus: SyncStatus
  lastSyncedAt?: string
}

export interface KpisViewState {
  kpis: KpiWithStatus[]
  selectedKpi: KpiWithStatus | null
  isLoading: boolean
  error: string | null
  isSaving: boolean
}

export interface KpisViewModel extends KpisViewState {
  selectKpi: (kpi: KpiWithStatus) => void
  saveKpiToVault: (kpi: KpiDefinition) => Promise<void>
  refreshKpis: () => Promise<void>
}

const DEFAULT_COMPANY_ID = 'bavans-publishing'

export const useKpisViewModel = (companyId?: string): KpisViewModel => {
  const actualCompanyId = companyId || DEFAULT_COMPANY_ID

  const [kpis, setKpis] = useState<KpiWithStatus[]>([])
  const [selectedKpi, setSelectedKpi] = useState<KpiWithStatus | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  const loadKpis = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      const [kpisResponse, syncResponse] = await Promise.all([
        repo.getKpis(actualCompanyId),
        repo.getSyncStatus(actualCompanyId)
      ])

      if (kpisResponse.isSuccess && kpisResponse.data) {
        const syncMap = syncResponse.isSuccess && syncResponse.data ? syncResponse.data : {}

        const kpisWithStatus: KpiWithStatus[] = kpisResponse.data.map((kpi) => ({
          kpi,
          syncStatus: syncMap[kpi.uid] || 'DRAFT'
        }))

        setKpis(kpisWithStatus)
      } else {
        setError(String(kpisResponse.statusMessage ?? 'Failed to load KPIs'))
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setIsLoading(false)
    }
  }, [actualCompanyId])

  const selectKpi = useCallback((kpiWithStatus: KpiWithStatus) => {
    setSelectedKpi(kpiWithStatus)
  }, [])

  const saveKpiToVault = useCallback(
    async (kpi: KpiDefinition) => {
      try {
        setIsSaving(true)
        setError(null)

        const response = await repo.saveKpiToVault(actualCompanyId, kpi)
        if (response.isSuccess) {
          setKpis((prev) =>
            prev.map((k) =>
              k.kpi.uid === kpi.uid
                ? {
                    ...k,
                    syncStatus: 'IN_VAULT' as SyncStatus,
                    lastSyncedAt: new Date().toISOString()
                  }
                : k
            )
          )
          if (selectedKpi?.kpi.uid === kpi.uid) {
            setSelectedKpi((prev) =>
              prev
                ? {
                    ...prev,
                    syncStatus: 'IN_VAULT' as SyncStatus,
                    lastSyncedAt: new Date().toISOString()
                  }
                : null
            )
          }
        } else {
          setError(String(response.statusMessage ?? 'Failed to save to vault'))
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to save to vault')
      } finally {
        setIsSaving(false)
      }
    },
    [actualCompanyId, selectedKpi]
  )

  useEffect(() => {
    loadKpis()
  }, [loadKpis])

  return {
    kpis,
    selectedKpi,
    isLoading,
    error,
    isSaving,
    selectKpi,
    saveKpiToVault,
    refreshKpis: loadKpis
  }
}
