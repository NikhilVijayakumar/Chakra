import type { ServerResponse } from 'astra'
import { successResponse } from 'prana/services/ipcResponseFactory'
import type { TriageItem } from '../../triage/repo/TriageRepo'

export interface RoutedIncident extends TriageItem {
  assignedTo?: string
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  ruleApplied?: string
}

export class TriageIncidentRoutingRepo {
  async fetchPendingIncidents(): Promise<ServerResponse<RoutedIncident[]>> {
    try {
      const items = await window.api.operations.getTriage()
      const pending = items.filter((item) => item.status === 'PENDING').map((item) => ({ ...item }))

      return successResponse(pending)
    } catch (error) {
      console.error('[TriageIncidentRoutingRepo] fetchPendingIncidents failed', error)
      return successResponse([])
    }
  }

  async assignIncident(
    id: string,
    assignedTo: string,
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  ): Promise<ServerResponse<boolean>> {
    try {
      // TODO: Switch to typed operation when updateTriage is exposed in preload d.ts
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (window.api.operations as any).updateTriage?.(id, { assignedTo, priority })
      return successResponse(true)
    } catch (error) {
      console.error('[TriageIncidentRoutingRepo] assignIncident failed', error)
      return successResponse(false)
    }
  }

  async escalateIncident(id: string, reason: string): Promise<ServerResponse<boolean>> {
    try {
      // TODO: add dedicated escalation operation when available.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (window.api.operations as any).escalateTriageIncident?.(id, { reason })
      return successResponse(true)
    } catch (error) {
      console.error('[TriageIncidentRoutingRepo] escalateIncident failed', error)
      return successResponse(false)
    }
  }
}
