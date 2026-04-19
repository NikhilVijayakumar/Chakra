import { useEffect, useState } from 'react'
import { useDataState } from 'astra'
import { KpiVerificationCronRepo, type CronJob } from '../repo/KpiVerificationCronRepo'

const CRON_EXPRESSION_REGEX = /^[\d\s*\-,/]+$/
const MAX_CRON_EXPRESSION_LENGTH = 50
const MAX_CRON_NAME_LENGTH = 100

export const useKpiVerificationCronViewModel = () => {
  const repo = new KpiVerificationCronRepo()
  const [cronState, executeLoad] = useDataState<CronJob[]>()

  const [newCronExpression, setCronExpression] = useState('0 */12 * * *')
  const [newCronName, setCronName] = useState('KPI Verification')
  const [isCreating, setIsCreating] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)

  useEffect(() => {
    executeLoad(() => repo.listCrons())
  }, [])

  const reload = async (): Promise<void> => {
    await executeLoad(() => repo.listCrons())
  }

  const createCron = async (): Promise<void> => {
    const expression = newCronExpression.trim()
    const name = newCronName.trim()

    if (!name || name.length > MAX_CRON_NAME_LENGTH) {
      setFormError('Cron name must be between 1 and 100 characters')
      return
    }

    if (
      !expression ||
      expression.length > MAX_CRON_EXPRESSION_LENGTH ||
      !CRON_EXPRESSION_REGEX.test(expression)
    ) {
      setFormError('Cron expression is invalid')
      return
    }

    setFormError(null)
    setIsCreating(true)
    try {
      await repo.createCron({
        id: `kpi-verification-${Date.now()}`,
        name,
        cronExpression: expression
      })
      await reload()
    } finally {
      setIsCreating(false)
    }
  }

  const updateCron = async (
    id: string,
    updates: Partial<{ name: string; cronExpression: string; enabled: boolean }>
  ): Promise<void> => {
    await repo.updateCron(id, updates)
    await reload()
  }

  const pauseCron = async (id: string): Promise<void> => {
    await repo.pauseCron(id)
    await reload()
  }

  const resumeCron = async (id: string): Promise<void> => {
    await repo.resumeCron(id)
    await reload()
  }

  const runNow = async (id: string): Promise<void> => {
    await repo.runNow(id)
    await reload()
  }

  const deleteCron = async (id: string): Promise<void> => {
    await repo.deleteCron(id)
    await reload()
  }

  return {
    cronState,
    newCronExpression,
    newCronName,
    isCreating,
    editingId,
    formError,
    setCronExpression,
    setCronName,
    setEditingId,
    createCron,
    updateCron,
    pauseCron,
    resumeCron,
    runNow,
    deleteCron,
    reload
  }
}
