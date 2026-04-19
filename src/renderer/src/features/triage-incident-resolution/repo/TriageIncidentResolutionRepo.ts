import type { ServerResponse } from 'astra'
import { successResponse } from 'prana/services/ipcResponseFactory'
import type { TriageItem } from '../../triage/repo/TriageRepo'

export interface ResolvedIncident extends TriageItem {
  resolvedBy?: string
  resolutionNotes?: string
  resolvedAt?: string
}

export class TriageIncidentResolutionRepo {
  async fetchInProgressIncidents(): Promise<ServerResponse<ResolvedIncident[]>> {
    try {
      const items = await window.api.operations.getTriage()
      return successResponse(
        items.filter((item) => item.status === 'ANALYSIS').map((item) => ({ ...item }))
      )
    } catch (error) {
      console.error('[TriageIncidentResolutionRepo] fetchInProgressIncidents failed', error)
      return successResponse([])
    }
  }

  async fetchResolvedIncidents(): Promise<ServerResponse<ResolvedIncident[]>> {
    try {
      const items = await window.api.operations.getTriage()
      return successResponse(
        items.filter((item) => item.status === 'CLEARED').map((item) => ({ ...item }))
      )
    } catch (error) {
      console.error('[TriageIncidentResolutionRepo] fetchResolvedIncidents failed', error)
      return successResponse([])
    }
  }

  async resolveIncident(id: string, resolutionNotes: string): Promise<ServerResponse<boolean>> {
    try {
      await window.api.operations.runTriageAction(id, 'CLEAR')
      // TODO: Switch to typed operation when updateTriage is exposed.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (window.api.operations as any).updateTriage?.(id, {
        resolutionNotes,
        resolvedAt: new Date().toISOString()
      })
      return successResponse(true)
    } catch (error) {
      console.error('[TriageIncidentResolutionRepo] resolveIncident failed', error)
      return successResponse(false)
    }
  }

  async reopenIncident(id: string, reason: string): Promise<ServerResponse<boolean>> {
    try {
      // TODO: add dedicated reopen IPC operation when available.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (window.api.operations as any).reopenTriageIncident?.(id, { reason })
      return successResponse(true)
    } catch (error) {
      console.error('[TriageIncidentResolutionRepo] reopenIncident failed', error)
      return successResponse(false)
    }
  }
}
