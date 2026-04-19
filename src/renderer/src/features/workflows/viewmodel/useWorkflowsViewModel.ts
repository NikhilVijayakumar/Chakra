import { useState, useEffect, useCallback } from 'react'
import { WorkflowsRepo, type WorkflowDefinition, type SyncStatus } from '../repo/WorkflowsRepo'

const repo = new WorkflowsRepo()

export interface WorkflowWithStatus {
  workflow: WorkflowDefinition
  syncStatus: SyncStatus
  lastSyncedAt?: string
}

export interface WorkflowsViewState {
  workflows: WorkflowWithStatus[]
  selectedWorkflow: WorkflowWithStatus | null
  isLoading: boolean
  error: string | null
  isSaving: boolean
}

export interface WorkflowsViewModel extends WorkflowsViewState {
  selectWorkflow: (workflow: WorkflowWithStatus) => void
  saveWorkflowToVault: (workflow: WorkflowDefinition) => Promise<void>
  refreshWorkflows: () => Promise<void>
}

const DEFAULT_COMPANY_ID = 'bavans-publishing'

export const useWorkflowsViewModel = (companyId?: string): WorkflowsViewModel => {
  const actualCompanyId = companyId || DEFAULT_COMPANY_ID

  const [workflows, setWorkflows] = useState<WorkflowWithStatus[]>([])
  const [selectedWorkflow, setSelectedWorkflow] = useState<WorkflowWithStatus | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  const loadWorkflows = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      const [workflowsResponse, syncResponse] = await Promise.all([
        repo.getWorkflows(actualCompanyId),
        repo.getSyncStatus(actualCompanyId)
      ])

      if (workflowsResponse.isSuccess && workflowsResponse.data) {
        const syncMap = syncResponse.isSuccess && syncResponse.data ? syncResponse.data : {}

        const workflowsWithStatus: WorkflowWithStatus[] = workflowsResponse.data.map(
          (workflow) => ({
            workflow,
            syncStatus: syncMap[workflow.id] || 'DRAFT'
          })
        )

        setWorkflows(workflowsWithStatus)
      } else {
        setError(String(workflowsResponse.statusMessage ?? 'Failed to load workflows'))
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setIsLoading(false)
    }
  }, [actualCompanyId])

  const selectWorkflow = useCallback((workflowWithStatus: WorkflowWithStatus) => {
    setSelectedWorkflow(workflowWithStatus)
  }, [])

  const saveWorkflowToVault = useCallback(
    async (workflow: WorkflowDefinition) => {
      try {
        setIsSaving(true)
        setError(null)

        const response = await repo.saveWorkflowToVault(actualCompanyId, workflow)
        if (response.isSuccess) {
          setWorkflows((prev) =>
            prev.map((w) =>
              w.workflow.id === workflow.id
                ? {
                    ...w,
                    syncStatus: 'IN_VAULT' as SyncStatus,
                    lastSyncedAt: new Date().toISOString()
                  }
                : w
            )
          )
          if (selectedWorkflow?.workflow.id === workflow.id) {
            setSelectedWorkflow((prev) =>
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
    [actualCompanyId, selectedWorkflow]
  )

  useEffect(() => {
    loadWorkflows()
  }, [loadWorkflows])

  return {
    workflows,
    selectedWorkflow,
    isLoading,
    error,
    isSaving,
    selectWorkflow,
    saveWorkflowToVault,
    refreshWorkflows: loadWorkflows
  }
}
