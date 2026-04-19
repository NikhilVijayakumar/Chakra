import { successResponse } from 'prana/services/ipcResponseFactory'
import type { ServerResponse } from 'astra'

export interface KPI {
  name: string
  value: string
  trend: 'up' | 'down' | 'neutral'
}

export interface Tool {
  name: string
  type: 'Skill' | 'Rule' | 'Script'
  description: string
}

export interface EmployeeProfile {
  id: string
  name: string
  role: string
  triggerName: string
  triggerDesignation: string
  avatar: string
  backstory: string
  workflow: string[]
  tools: Tool[]
  kpis: KPI[]
  canRequestFrom: string[]
  receivesFrom: string[]
}

export class EmployeeProfileRepo {
  async getProfile(employeeId: string): Promise<ServerResponse<Omit<EmployeeProfile, 'avatar'>>> {
    const payload = await window.api.operations.getEmployeeProfile(employeeId)
    return successResponse(payload)
  }
}
