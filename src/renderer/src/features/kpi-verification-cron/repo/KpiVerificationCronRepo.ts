import type { ServerResponse } from 'astra'
import { successResponse } from 'prana/services/ipcResponseFactory'

export interface CronJob {
  id: string
  name: string
  cronExpression: string
  status: 'ACTIVE' | 'PAUSED' | 'FAILED'
  nextRunAt: string | null
  lastRunAt: string | null
  lastResult: 'success' | 'error' | null
  config: Record<string, unknown>
}

type PreloadCronJob = Awaited<ReturnType<typeof window.api.cron.list>>[number]

const mapCronJob = (job: PreloadCronJob): CronJob => ({
  id: job.id,
  name: job.name,
  cronExpression: job.expression,
  status: !job.enabled ? 'PAUSED' : job.lastRunStatus === 'FAILED' ? 'FAILED' : 'ACTIVE',
  nextRunAt: job.nextRunAt,
  lastRunAt: job.lastRunAt,
  lastResult: job.lastRunStatus === 'FAILED' ? 'error' : job.lastRunStatus ? 'success' : null,
  config: {
    target: job.target,
    recoveryPolicy: job.recoveryPolicy,
    retentionDays: job.retentionDays,
    maxRuntimeMs: job.maxRuntimeMs,
    running: job.running,
    runCount: job.runCount
  }
})

export class KpiVerificationCronRepo {
  async listCrons(): Promise<ServerResponse<CronJob[]>> {
    try {
      const jobs = await window.api.cron.list()
      return successResponse(jobs.map(mapCronJob))
    } catch (error) {
      console.error('[KpiVerificationCronRepo] listCrons failed', error)
      return successResponse([])
    }
  }

  async createCron(job: {
    id: string
    name: string
    cronExpression: string
  }): Promise<ServerResponse<CronJob | null>> {
    try {
      const created = await window.api.cron.upsert({
        id: job.id,
        name: job.name,
        expression: job.cronExpression,
        target: 'kpi:verification',
        enabled: true
      })
      return successResponse(mapCronJob(created))
    } catch (error) {
      console.error('[KpiVerificationCronRepo] createCron failed', error)
      return successResponse(null)
    }
  }

  async updateCron(
    id: string,
    updates: Partial<{ name: string; cronExpression: string; enabled: boolean }>
  ): Promise<ServerResponse<CronJob | null>> {
    try {
      const existing = await window.api.cron.list()
      const current = existing.find((job) => job.id === id)
      if (!current) {
        return successResponse(null)
      }

      const updated = await window.api.cron.upsert({
        id,
        name: updates.name ?? current.name,
        expression: updates.cronExpression ?? current.expression,
        target: current.target,
        enabled: updates.enabled ?? current.enabled,
        recoveryPolicy: current.recoveryPolicy,
        retentionDays: current.retentionDays,
        maxRuntimeMs: current.maxRuntimeMs
      })

      return successResponse(mapCronJob(updated))
    } catch (error) {
      console.error('[KpiVerificationCronRepo] updateCron failed', error)
      return successResponse(null)
    }
  }

  async pauseCron(id: string): Promise<ServerResponse<boolean>> {
    try {
      await window.api.cron.pause(id)
      return successResponse(true)
    } catch (error) {
      console.error('[KpiVerificationCronRepo] pauseCron failed', error)
      return successResponse(false)
    }
  }

  async resumeCron(id: string): Promise<ServerResponse<boolean>> {
    try {
      await window.api.cron.resume(id)
      return successResponse(true)
    } catch (error) {
      console.error('[KpiVerificationCronRepo] resumeCron failed', error)
      return successResponse(false)
    }
  }

  async runNow(id: string): Promise<ServerResponse<boolean>> {
    try {
      await window.api.cron.runNow(id)
      return successResponse(true)
    } catch (error) {
      console.error('[KpiVerificationCronRepo] runNow failed', error)
      return successResponse(false)
    }
  }

  async deleteCron(id: string): Promise<ServerResponse<boolean>> {
    try {
      const removed = await window.api.cron.remove(id)
      return successResponse(removed)
    } catch (error) {
      console.error('[KpiVerificationCronRepo] deleteCron failed', error)
      return successResponse(false)
    }
  }
}
