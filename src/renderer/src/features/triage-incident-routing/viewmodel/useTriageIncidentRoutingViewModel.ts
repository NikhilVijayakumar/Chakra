import { useEffect, useMemo, useState } from 'react'
import { useDataState } from 'astra'
import { TriageIncidentRoutingRepo, type RoutedIncident } from '../repo/TriageIncidentRoutingRepo'

export const useTriageIncidentRoutingViewModel = () => {
  const repo = new TriageIncidentRoutingRepo()
  const [incidentsState, executeLoad] = useDataState<RoutedIncident[]>()
  const [selectedIncident, setSelectedIncident] = useState<RoutedIncident | null>(null)
  const [assignmentPanel, setAssignmentPanel] = useState<{
    id: string
    assignmentInProgress: boolean
  } | null>(null)

  useEffect(() => {
    executeLoad(() => repo.fetchPendingIncidents())
  }, [])

  const reload = async (): Promise<void> => {
    await executeLoad(() => repo.fetchPendingIncidents())
  }

  const selectIncident = (incident: RoutedIncident): void => {
    setSelectedIncident(incident)
  }

  const assignIncident = async (
    id: string,
    assignedTo: string,
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  ): Promise<void> => {
    setAssignmentPanel({ id, assignmentInProgress: true })
    try {
      await repo.assignIncident(id, assignedTo, priority)
      await reload()
    } finally {
      setAssignmentPanel(null)
    }
  }

  const escalateIncident = async (id: string, reason: string): Promise<void> => {
    await repo.escalateIncident(id, reason)
    await reload()
  }

  const availableHandlers = useMemo(() => {
    const fromIncidents = (incidentsState.data ?? []).map((item) => item.source)
    return Array.from(new Set(['director', ...fromIncidents]))
  }, [incidentsState.data])

  return {
    incidentsState,
    selectedIncident,
    assignmentPanel,
    availableHandlers,
    selectIncident,
    assignIncident,
    escalateIncident,
    reload
  }
}
