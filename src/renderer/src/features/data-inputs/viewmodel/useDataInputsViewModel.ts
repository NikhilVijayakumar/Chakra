import { useState, useEffect, useCallback } from 'react'
import { DataInputsRepo, type DataInputDefinition, type SyncStatus } from '../repo/DataInputsRepo'

const repo = new DataInputsRepo()

export interface DataInputWithStatus {
  dataInput: DataInputDefinition
  syncStatus: SyncStatus
  lastSyncedAt?: string
}

export interface DataInputsViewState {
  dataInputs: DataInputWithStatus[]
  selectedDataInput: DataInputWithStatus | null
  isLoading: boolean
  error: string | null
  isSaving: boolean
}

export interface DataInputsViewModel extends DataInputsViewState {
  selectDataInput: (dataInput: DataInputWithStatus) => void
  saveDataInputToVault: (dataInput: DataInputDefinition) => Promise<void>
  refreshDataInputs: () => Promise<void>
}

const DEFAULT_COMPANY_ID = 'bavans-publishing'

export const useDataInputsViewModel = (companyId?: string): DataInputsViewModel => {
  const actualCompanyId = companyId || DEFAULT_COMPANY_ID

  const [dataInputs, setDataInputs] = useState<DataInputWithStatus[]>([])
  const [selectedDataInput, setSelectedDataInput] = useState<DataInputWithStatus | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  const loadDataInputs = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      const [dataInputsResponse, syncResponse] = await Promise.all([
        repo.getDataInputs(actualCompanyId),
        repo.getSyncStatus(actualCompanyId)
      ])

      if (dataInputsResponse.isSuccess && dataInputsResponse.data) {
        const syncMap = syncResponse.isSuccess && syncResponse.data ? syncResponse.data : {}

        const dataInputsWithStatus: DataInputWithStatus[] = dataInputsResponse.data.map(
          (dataInput) => ({
            dataInput,
            syncStatus: syncMap[dataInput.uid] || 'DRAFT'
          })
        )

        setDataInputs(dataInputsWithStatus)
      } else {
        setError(String(dataInputsResponse.statusMessage ?? 'Failed to load data inputs'))
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setIsLoading(false)
    }
  }, [actualCompanyId])

  const selectDataInput = useCallback((dataInputWithStatus: DataInputWithStatus) => {
    setSelectedDataInput(dataInputWithStatus)
  }, [])

  const saveDataInputToVault = useCallback(
    async (dataInput: DataInputDefinition) => {
      try {
        setIsSaving(true)
        setError(null)

        const response = await repo.saveDataInputToVault(actualCompanyId, dataInput)
        if (response.isSuccess) {
          setDataInputs((prev) =>
            prev.map((d) =>
              d.dataInput.uid === dataInput.uid
                ? {
                    ...d,
                    syncStatus: 'IN_VAULT' as SyncStatus,
                    lastSyncedAt: new Date().toISOString()
                  }
                : d
            )
          )
          if (selectedDataInput?.dataInput.uid === dataInput.uid) {
            setSelectedDataInput((prev) =>
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
    [actualCompanyId, selectedDataInput]
  )

  useEffect(() => {
    loadDataInputs()
  }, [loadDataInputs])

  return {
    dataInputs,
    selectedDataInput,
    isLoading,
    error,
    isSaving,
    selectDataInput,
    saveDataInputToVault,
    refreshDataInputs: loadDataInputs
  }
}
