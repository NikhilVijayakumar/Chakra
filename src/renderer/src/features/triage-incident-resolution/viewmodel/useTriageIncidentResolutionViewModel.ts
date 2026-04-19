import { useEffect, useMemo, useState } from 'react'
import { useDataState } from 'astra'
import { successResponse } from 'prana/services/ipcResponseFactory'
import {
  TriageIncidentResolutionRepo,
  type ResolvedIncident
} from '../repo/TriageIncidentResolutionRepo'

interface ResolutionState {
  inProgress: ResolvedIncident[]
  resolved: ResolvedIncident[]
}

export const useTriageIncidentResolutionViewModel = () => {
  const repo = new TriageIncidentResolutionRepo()
  const [state, executeLoad] = useDataState<ResolutionState>()
  const [activeTab, setActiveTab] = useState<'in-progress' | 'resolved'>('in-progress')
  const [selectedIncident, setSelectedIncident] = useState<ResolvedIncident | null>(null)
  const [resolutionNotes, setResolutionNotes] = useState('')

  const reload = async (): Promise<void> => {
    await executeLoad(async () => {
      const [inProgressResult, resolvedResult] = await Promise.all([
        repo.fetchInProgressIncidents(),
        repo.fetchResolvedIncidents()
      ])

      return successResponse({
        inProgress: inProgressResult.data ?? [],
        resolved: resolvedResult.data ?? []
      })
    })
  }

  useEffect(() => {
    reload()
  }, [])

  const selectIncident = (incident: ResolvedIncident): void => {
    setSelectedIncident(incident)
    setResolutionNotes(incident.resolutionNotes ?? '')
  }

  const resolveIncident = async (id: string, notes: string): Promise<void> => {
    const sanitizedNotes = notes.replace(/<[^>]*>/g, '').slice(0, 2000)
    await repo.resolveIncident(id, sanitizedNotes)
    await reload()
    setSelectedIncident(null)
    setResolutionNotes('')
  }

  const reopenIncident = async (id: string, reason: string): Promise<void> => {
    await repo.reopenIncident(id, reason)
    await reload()
  }

  const incidents = useMemo(() => {
    if (!state.data) {
      return []
    }

    return activeTab === 'in-progress' ? state.data.inProgress : state.data.resolved
  }, [activeTab, state.data])

  return {
    state,
    activeTab,
    selectedIncident,
    resolutionNotes,
    incidents,
    setActiveTab,
    setResolutionNotes,
    selectIncident,
    resolveIncident,
    reopenIncident,
    reload
  }
}
