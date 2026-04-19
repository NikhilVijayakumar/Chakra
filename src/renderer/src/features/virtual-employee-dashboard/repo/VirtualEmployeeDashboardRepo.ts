import { successResponse } from 'prana/services/ipcResponseFactory'
import type { ServerResponse } from 'astra'

interface DharmaKpiDefinition {
  uid: string
  name: string
  description: string
  unit: string
  target: string
  value: string
  formula?: string
  goalMapping: string
  frequencyOfCheck?: 'real-time' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'on-demand'
  responsibleAgentRole?: string
  thresholds?: { critical?: string; warning?: string; optimal?: string }
}

export interface EmployeeIdentity {
  id: string
  name: string
  department: string
  role: string
}

export interface EmployeeDashboardMetric {
  id: string
  name: string
  value: number
  unit: string
  trend: 'up' | 'down' | 'stable'
  target: number
  department: string
}

export interface EmployeeDashboard {
  employeeId: string
  employeeName: string
  department: string
  role: string
  generatedAt: string
  metrics: EmployeeDashboardMetric[]
  assignments?: Array<{ id: string; title: string; status: string }>
}

const parseNumber = (value: string): number => {
  const normalized = value.replace(/[^0-9.-]/g, '')
  const parsed = Number(normalized)
  return Number.isFinite(parsed) ? parsed : 0
}

const inferDepartment = (role: string): string => {
  const normalizedRole = role.toLowerCase()
  if (normalizedRole.includes('finance')) return 'finance'
  if (normalizedRole.includes('ops') || normalizedRole.includes('operation')) return 'operations'
  if (normalizedRole.includes('sales') || normalizedRole.includes('marketing')) return 'growth'
  if (normalizedRole.includes('security') || normalizedRole.includes('compliance'))
    return 'governance'
  return 'general'
}

export class VirtualEmployeeDashboardRepo {
  async getCurrentEmployee(): Promise<ServerResponse<EmployeeIdentity>> {
    try {
      const lifecycle = await window.api.operations.getLifecycleSnapshot()
      const firstProfile = lifecycle.profiles[0]
      if (!firstProfile) {
        return successResponse({
          id: 'director',
          name: 'Director',
          department: 'general',
          role: 'Director'
        })
      }

      return successResponse({
        id: firstProfile.agentId,
        name: firstProfile.name,
        role: firstProfile.role,
        department: inferDepartment(firstProfile.role)
      })
    } catch (error) {
      console.error('[VirtualEmployeeDashboardRepo] getCurrentEmployee failed', error)
      return successResponse({
        id: 'director',
        name: 'Director',
        department: 'general',
        role: 'Director'
      })
    }
  }

  async getEmployeeMetrics(employeeId: string): Promise<ServerResponse<EmployeeDashboardMetric[]>> {
    try {
      const employeeResult = await this.getCurrentEmployee()
      const employee = employeeResult.data
      if (!employee) {
        return successResponse([])
      }

      const companyId = await window.api.dharma.getActiveCompany()
      if (!companyId) {
        return successResponse([])
      }

      const kpis = (await window.api.dharma.getKpis(companyId)) as unknown as DharmaKpiDefinition[]
      const roleToken = employee.role.toLowerCase()
      const departmentToken = employee.department.toLowerCase()

      const filtered = kpis.filter((kpi) => {
        const role = (kpi.responsibleAgentRole ?? '').toLowerCase()
        const mapping = (kpi.goalMapping ?? '').toLowerCase()
        const descriptor = `${kpi.name} ${kpi.description}`.toLowerCase()

        return (
          role.includes(roleToken) ||
          mapping.includes(roleToken) ||
          mapping.includes(departmentToken) ||
          descriptor.includes(departmentToken) ||
          descriptor.includes(employeeId.toLowerCase())
        )
      })

      const scoped = (filtered.length > 0 ? filtered : kpis.slice(0, 8)).map((kpi) => ({
        id: kpi.uid,
        name: kpi.name,
        value: parseNumber(kpi.value),
        unit: kpi.unit,
        trend: 'stable' as const,
        target: parseNumber(kpi.target),
        department: employee.department
      }))

      return successResponse(scoped)
    } catch (error) {
      console.error('[VirtualEmployeeDashboardRepo] getEmployeeMetrics failed', error)
      return successResponse([])
    }
  }

  async getDashboard(employeeId: string): Promise<ServerResponse<EmployeeDashboard>> {
    try {
      const [employeeResult, metricsResult, dashboardPayload] = await Promise.all([
        this.getCurrentEmployee(),
        this.getEmployeeMetrics(employeeId),
        window.api.operations.getDashboard()
      ])

      const employee = employeeResult.data
      if (!employee) {
        throw new Error('No employee context available')
      }

      const fallbackMetrics: EmployeeDashboardMetric[] = dashboardPayload.kpis.map((metric) => ({
        id: metric.id,
        name: metric.label,
        value: parseNumber(metric.value),
        unit: '',
        trend:
          metric.status === 'critical'
            ? ('down' as const)
            : metric.status === 'healthy'
              ? ('up' as const)
              : ('stable' as const),
        target: parseNumber(metric.detail),
        department: employee.department
      }))

      const assignments = dashboardPayload.highlights.slice(0, 5).map((line, index) => ({
        id: `assignment-${index + 1}`,
        title: line,
        status: 'ACTIVE'
      }))

      return successResponse({
        employeeId: employee.id,
        employeeName: employee.name,
        department: employee.department,
        role: employee.role,
        generatedAt: dashboardPayload.generatedAt,
        metrics: (metricsResult.data && metricsResult.data.length > 0
          ? metricsResult.data
          : fallbackMetrics
        ).slice(0, 9),
        assignments
      })
    } catch (error) {
      console.error('[VirtualEmployeeDashboardRepo] getDashboard failed', error)
      return successResponse({
        employeeId,
        employeeName: 'Employee',
        department: 'general',
        role: 'Viewer',
        generatedAt: new Date().toISOString(),
        metrics: [],
        assignments: []
      })
    }
  }

  async updateMetricTarget(metricId: string, newTarget: number): Promise<ServerResponse<boolean>> {
    try {
      const boundedTarget = Math.max(0, Math.min(999999, newTarget))
      const companyId = await window.api.dharma.getActiveCompany()
      if (!companyId) {
        return successResponse(false)
      }

      const kpis = (await window.api.dharma.getKpis(companyId)) as unknown as DharmaKpiDefinition[]
      const targetKpi = kpis.find((kpi) => kpi.uid === metricId || kpi.name === metricId)
      if (!targetKpi) {
        return successResponse(false)
      }

      const updatedKpi: DharmaKpiDefinition = {
        ...targetKpi,
        target: String(boundedTarget)
      }

      await window.api.dharma.saveKpiToVault(
        companyId,
        updatedKpi as unknown as Parameters<typeof window.api.dharma.saveKpiToVault>[1]
      )
      return successResponse(true)
    } catch (error) {
      console.error('[VirtualEmployeeDashboardRepo] updateMetricTarget failed', error)
      return successResponse(false)
    }
  }
}
