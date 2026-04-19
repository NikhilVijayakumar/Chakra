import { useState, useEffect, useCallback } from 'react'
import { ProtocolsRepo, type ProtocolDoc, type SyncStatus } from '../repo/ProtocolsRepo'

const repo = new ProtocolsRepo()

export interface ProtocolWithStatus {
  protocol: ProtocolDoc
  syncStatus: SyncStatus
  lastSyncedAt?: string
}

export interface ProtocolsViewState {
  protocols: ProtocolWithStatus[]
  selectedProtocol: ProtocolWithStatus | null
  isLoading: boolean
  error: string | null
  isSaving: boolean
}

export interface ProtocolsViewModel extends ProtocolsViewState {
  selectProtocol: (protocol: ProtocolWithStatus) => void
  saveProtocolToVault: (protocol: ProtocolDoc) => Promise<void>
  refreshProtocols: () => Promise<void>
}

const DEFAULT_COMPANY_ID = 'bavans-publishing'

export const useProtocolsViewModel = (companyId?: string): ProtocolsViewModel => {
  const actualCompanyId = companyId || DEFAULT_COMPANY_ID

  const [protocols, setProtocols] = useState<ProtocolWithStatus[]>([])
  const [selectedProtocol, setSelectedProtocol] = useState<ProtocolWithStatus | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  const loadProtocols = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      const [protocolsResponse, syncResponse] = await Promise.all([
        repo.getProtocols(actualCompanyId),
        repo.getSyncStatus(actualCompanyId)
      ])

      if (protocolsResponse.isSuccess && protocolsResponse.data) {
        const syncMap = syncResponse.isSuccess && syncResponse.data ? syncResponse.data : {}

        const protocolsWithStatus: ProtocolWithStatus[] = protocolsResponse.data.map(
          (protocol) => ({
            protocol,
            syncStatus: syncMap[protocol.id] || 'DRAFT'
          })
        )

        setProtocols(protocolsWithStatus)
      } else {
        setError(String(protocolsResponse.statusMessage ?? 'Failed to load protocols'))
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setIsLoading(false)
    }
  }, [actualCompanyId])

  const selectProtocol = useCallback((protocolWithStatus: ProtocolWithStatus) => {
    setSelectedProtocol(protocolWithStatus)
  }, [])

  const saveProtocolToVault = useCallback(
    async (protocol: ProtocolDoc) => {
      try {
        setIsSaving(true)
        setError(null)

        const response = await repo.saveProtocolToVault(actualCompanyId, protocol)
        if (response.isSuccess) {
          setProtocols((prev) =>
            prev.map((p) =>
              p.protocol.id === protocol.id
                ? {
                    ...p,
                    syncStatus: 'IN_VAULT' as SyncStatus,
                    lastSyncedAt: new Date().toISOString()
                  }
                : p
            )
          )
          if (selectedProtocol?.protocol.id === protocol.id) {
            setSelectedProtocol((prev) =>
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
    [actualCompanyId, selectedProtocol]
  )

  useEffect(() => {
    loadProtocols()
  }, [loadProtocols])

  return {
    protocols,
    selectedProtocol,
    isLoading,
    error,
    isSaving,
    selectProtocol,
    saveProtocolToVault,
    refreshProtocols: loadProtocols
  }
}
