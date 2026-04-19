import type { ServerResponse } from 'astra'
import { successResponse } from 'prana/services/ipcResponseFactory'
import type { TriageItem } from '../../triage/repo/TriageRepo'

export interface KpiBreachAlert {
  id: string
  kpiName: string
  currentValue: number
  threshold: number
  severity: 'CRITICAL' | 'WARNING'
  linkedAgent: string
  detectedAt: string
  status: 'active' | 'acknowledged' | 'resolved'
}

const TRIAGE_STATUS_TO_BREACH_STATUS: Record<TriageItem['status'], KpiBreachAlert['status']> = {
  PENDING: 'active',
  ANALYSIS: 'acknowledged',
  CLEARED: 'resolved'
}

export class KpiBreachAlertingRepo {
  async getBreaches(): Promise<ServerResponse<KpiBreachAlert[]>> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const getKpiBreach = (window.api.operations as any).getKpiBreach as
        | (() => Promise<KpiBreachAlert[]>)
        | undefined

      if (getKpiBreach) {
        const payload = await getKpiBreach()
        return successResponse(payload)
      }

      const triageItems = await window.api.operations.getTriage()
      const breaches = triageItems
        .filter((item) => /breach|kpi|threshold/i.test(item.topic))
        .map((item) => this.mapTriageItemToBreach(item))

      return successResponse(breaches)
    } catch (error) {
      console.error('[KpiBreachAlertingRepo] getBreaches failed', error)
      return successResponse([])
    }
  }

  async acknowledgeAlert(id: string): Promise<ServerResponse<boolean>> {
    try {
      // TODO: replace with typed IPC API when operation is exposed.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (window.api.operations as any).updateAlert?.(id, { status: 'acknowledged' })
      return successResponse(true)
    } catch (error) {
      console.error('[KpiBreachAlertingRepo] acknowledgeAlert failed', error)
      return successResponse(false)
    }
  }

  async resolveAlert(id: string): Promise<ServerResponse<boolean>> {
    try {
      // TODO: replace with typed IPC API when operation is exposed.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (window.api.operations as any).updateAlert?.(id, { status: 'resolved' })
      return successResponse(true)
    } catch (error) {
      console.error('[KpiBreachAlertingRepo] resolveAlert failed', error)
      return successResponse(false)
    }
  }

  private mapTriageItemToBreach(item: TriageItem): KpiBreachAlert {
    const severity: KpiBreachAlert['severity'] = /critical|sev-?1|p0/i.test(item.topic)
      ? 'CRITICAL'
      : 'WARNING'

    return {
      id: item.id,
      kpiName: item.topic,
      currentValue: 0,
      threshold: 0,
      severity,
      linkedAgent: item.source,
      detectedAt: item.receivedAt,
      status: TRIAGE_STATUS_TO_BREACH_STATUS[item.status] ?? 'active'
    }
  }
}
