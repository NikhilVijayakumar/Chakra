import { useState, useEffect, useCallback } from 'react'
import { AgentsRepo, type AgentDefinition, type SyncStatus } from '../repo/AgentsRepo'

const repo = new AgentsRepo()

export interface AgentWithStatus {
  agent: AgentDefinition
  syncStatus: SyncStatus
  lastSyncedAt?: string
}

export interface AgentsViewState {
  agents: AgentWithStatus[]
  selectedAgent: AgentWithStatus | null
  isLoading: boolean
  error: string | null
  isSaving: boolean
}

export interface AgentsViewModel extends AgentsViewState {
  selectAgent: (agent: AgentWithStatus) => void
  syncAgentToCache: (agent: AgentDefinition) => Promise<void>
  saveAgentToVault: (agent: AgentDefinition) => Promise<void>
  refreshAgents: () => Promise<void>
}

const DEFAULT_COMPANY_ID = 'bavans-publishing'

export const useAgentsViewModel = (companyId?: string): AgentsViewModel => {
  const actualCompanyId = companyId || DEFAULT_COMPANY_ID

  const [agents, setAgents] = useState<AgentWithStatus[]>([])
  const [selectedAgent, setSelectedAgent] = useState<AgentWithStatus | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  const loadAgents = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      const [catalogResponse, syncResponse] = await Promise.all([
        repo.getAgents(actualCompanyId),
        repo.getSyncStatus(actualCompanyId)
      ])

      if (catalogResponse.isSuccess && catalogResponse.data) {
        const syncMap = syncResponse.isSuccess && syncResponse.data ? syncResponse.data : {}

        const agentsWithStatus: AgentWithStatus[] = catalogResponse.data.entries.map((agent) => ({
          agent,
          syncStatus: syncMap[agent.uid] || 'NEW'
        }))

        setAgents(agentsWithStatus)
      } else {
        setError(String(catalogResponse.statusMessage ?? 'Failed to load agents'))
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setIsLoading(false)
    }
  }, [actualCompanyId])

  const selectAgent = useCallback((agentWithStatus: AgentWithStatus) => {
    setSelectedAgent(agentWithStatus)
  }, [])

  const syncAgentToCache = useCallback(
    async (agent: AgentDefinition) => {
      try {
        setIsSaving(true)
        setError(null)

        const response = await repo.syncAgentToCache(actualCompanyId, agent)
        if (response.isSuccess) {
          setAgents((prev) =>
            prev.map((a) =>
              a.agent.uid === agent.uid
                ? {
                    ...a,
                    syncStatus: 'NEW' as SyncStatus,
                    lastSyncedAt: new Date().toISOString()
                  }
                : a
            )
          )
          if (selectedAgent?.agent.uid === agent.uid) {
            setSelectedAgent((prev) =>
              prev
                ? {
                    ...prev,
                    syncStatus: 'NEW' as SyncStatus,
                    lastSyncedAt: new Date().toISOString()
                  }
                : null
            )
          }
        } else {
          setError(String(response.statusMessage ?? 'Failed to sync to cache'))
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to sync to cache')
      } finally {
        setIsSaving(false)
      }
    },
    [actualCompanyId, selectedAgent]
  )

  const saveAgentToVault = useCallback(
    async (agent: AgentDefinition) => {
      try {
        setIsSaving(true)
        setError(null)

        const response = await repo.saveAgentToVault(actualCompanyId, agent)
        if (response.isSuccess) {
          setAgents((prev) =>
            prev.map((a) =>
              a.agent.uid === agent.uid
                ? {
                    ...a,
                    syncStatus: 'SYNCED' as SyncStatus,
                    lastSyncedAt: new Date().toISOString()
                  }
                : a
            )
          )
          if (selectedAgent?.agent.uid === agent.uid) {
            setSelectedAgent((prev) =>
              prev
                ? {
                    ...prev,
                    syncStatus: 'SYNCED' as SyncStatus,
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
    [actualCompanyId, selectedAgent]
  )

  useEffect(() => {
    void loadAgents()
  }, [loadAgents])

  return {
    agents,
    selectedAgent,
    isLoading,
    error,
    isSaving,
    selectAgent,
    syncAgentToCache,
    saveAgentToVault,
    refreshAgents: loadAgents
  }
}
