import { HttpStatusCode, ServerResponse } from 'astra'

export interface DashboardKpi {
  id: string
  label: string
  value: string
  status: 'healthy' | 'watch' | 'critical'
  detail: string
}

export interface DashboardPayload {
  generatedAt: string
  kpis: DashboardKpi[]
  highlights: string[]
}

export class DashboardRepo {
  async getDashboard(): Promise<ServerResponse<DashboardPayload>> {
    const payload = await window.api.operations.getDashboard()

    return {
      isSuccess: true,
      isError: false,
      status: HttpStatusCode.SUCCESS,
      statusMessage: 'Loaded',
      data: payload
    } as ServerResponse<DashboardPayload>
  }
}
