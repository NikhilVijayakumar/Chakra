import { useEffect, useMemo, useState } from 'react'
import { useDataState } from 'astra'
import {
  VirtualEmployeeDashboardRepo,
  type EmployeeDashboard,
  type EmployeeDashboardMetric,
  type EmployeeIdentity
} from '../repo/VirtualEmployeeDashboardRepo'

const READ_ONLY_ROLE_TOKENS = ['intern', 'associate', 'analyst', 'junior', 'trainee']

export const useVirtualEmployeeDashboardViewModel = () => {
  const repo = new VirtualEmployeeDashboardRepo()
  const [dashboardState, executeLoad] = useDataState<EmployeeDashboard>()
  const [currentEmployee, setCurrentEmployee] = useState<EmployeeIdentity | null>(null)
  const [selectedMetric, setSelectedMetric] = useState<EmployeeDashboardMetric | null>(null)
  const [editPanelOpen, setEditPanelOpen] = useState(false)
  const [editingMetric, setEditingMetric] = useState<Partial<EmployeeDashboardMetric>>({})

  const loadDashboard = async (): Promise<void> => {
    const currentEmployeeResponse = await repo.getCurrentEmployee()
    const employee = currentEmployeeResponse.data
    if (!employee) {
      return
    }

    setCurrentEmployee(employee)
    await executeLoad(() => repo.getDashboard(employee.id))
  }

  useEffect(() => {
    loadDashboard()
  }, [])

  const canEdit = useMemo(() => {
    if (!currentEmployee) {
      return false
    }

    const role = currentEmployee.role.toLowerCase()
    return !READ_ONLY_ROLE_TOKENS.some((token) => role.includes(token))
  }, [currentEmployee])

  const selectMetric = (metric: EmployeeDashboardMetric): void => {
    setSelectedMetric(metric)
    setEditingMetric(metric)
    setEditPanelOpen(true)
  }

  const closeEditPanel = (): void => {
    setEditPanelOpen(false)
    setSelectedMetric(null)
    setEditingMetric({})
  }

  const setEditField = <K extends keyof EmployeeDashboardMetric>(
    field: K,
    value: EmployeeDashboardMetric[K]
  ): void => {
    setEditingMetric((previous) => ({ ...previous, [field]: value }))
  }

  const updateMetricTarget = async (metricId: string, newTarget: number): Promise<void> => {
    if (!canEdit) {
      return
    }

    const boundedTarget = Math.max(0, Math.min(999999, newTarget))
    await repo.updateMetricTarget(metricId, boundedTarget)
    await loadDashboard()
    closeEditPanel()
  }

  const currentMetrics = dashboardState.data?.metrics ?? []

  return {
    dashboardState,
    currentEmployee,
    selectedMetric,
    editPanelOpen,
    editingMetric,
    canEdit,
    currentMetrics,
    loadDashboard,
    selectMetric,
    closeEditPanel,
    setEditField,
    updateMetricTarget
  }
}
