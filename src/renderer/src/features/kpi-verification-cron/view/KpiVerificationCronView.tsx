import type { FC } from 'react'
import { Box, Button, Chip, Paper, Stack, TextField, Typography } from '@mui/material'
import { spacing, useLanguage } from 'astra'
import type { CronJob } from '../repo/KpiVerificationCronRepo'

interface KpiVerificationCronViewProps {
  jobs: CronJob[]
  isLoading: boolean
  isCreating: boolean
  error: string | null
  newCronName: string
  newCronExpression: string
  onNameChange: (name: string) => void
  onExpressionChange: (expression: string) => void
  onCreateCron: () => void
  onPauseCron: (id: string) => void
  onResumeCron: (id: string) => void
  onRunNow: (id: string) => void
  onDeleteCron: (id: string) => void
  onRefresh: () => void
}

export const KpiVerificationCronView: FC<KpiVerificationCronViewProps> = ({
  jobs,
  isLoading,
  isCreating,
  error,
  newCronName,
  newCronExpression,
  onNameChange,
  onExpressionChange,
  onCreateCron,
  onPauseCron,
  onResumeCron,
  onRunNow,
  onDeleteCron,
  onRefresh
}) => {
  const { literal } = useLanguage()

  return (
    <Box sx={{ p: spacing.xl, maxWidth: 1200, mx: 'auto' }}>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        sx={{ mb: spacing.md }}
      >
        <Typography variant="h5">
          {literal['kpiVerificationCron.title'] || 'KPI Verification Cron'}
        </Typography>
        <Button variant="outlined" onClick={onRefresh} disabled={isLoading}>
          {isLoading
            ? literal['global.loading'] || 'Loading'
            : literal['global.refresh'] || 'Refresh'}
        </Button>
      </Stack>

      {error && (
        <Paper sx={{ p: spacing.md, mb: spacing.md }}>
          <Typography color="error">{error}</Typography>
        </Paper>
      )}

      <Paper sx={{ p: spacing.md, mb: spacing.md }}>
        <Typography variant="h6" sx={{ mb: spacing.sm }}>
          {literal['kpiVerificationCron.createTitle'] || 'Create New Cron Job'}
        </Typography>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={spacing.sm}>
          <TextField
            size="small"
            label={literal['kpiVerificationCron.jobName'] || 'Job Name'}
            value={newCronName}
            onChange={(event) => onNameChange(event.target.value)}
            fullWidth
          />
          <TextField
            size="small"
            label={literal['kpiVerificationCron.cronExpression'] || 'Cron Expression'}
            helperText={literal['kpiVerificationCron.cronHint'] || 'e.g. 0 */12 * * *'}
            value={newCronExpression}
            onChange={(event) => onExpressionChange(event.target.value)}
            fullWidth
          />
          <Button variant="contained" onClick={onCreateCron} disabled={isCreating || isLoading}>
            {isCreating
              ? literal['global.creating'] || 'Creating'
              : literal['global.save'] || 'Save'}
          </Button>
        </Stack>
      </Paper>

      {jobs.length === 0 ? (
        <Paper sx={{ p: spacing.lg }}>
          <Typography>
            {literal['kpiVerificationCron.empty'] || 'No cron jobs configured'}
          </Typography>
        </Paper>
      ) : (
        <Stack spacing={spacing.md}>
          {jobs.map((job) => (
            <Paper key={job.id} sx={{ p: spacing.md }}>
              <Stack
                direction={{ xs: 'column', md: 'row' }}
                justifyContent="space-between"
                spacing={spacing.md}
              >
                <Box>
                  <Typography variant="h6">{job.name}</Typography>
                  <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                    {job.cronExpression}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {literal['kpiVerificationCron.nextRun'] || 'Next Run'}:{' '}
                    {job.status === 'PAUSED'
                      ? literal['kpiVerificationCron.paused'] || 'Paused'
                      : job.nextRunAt
                        ? new Date(job.nextRunAt).toLocaleString()
                        : literal['global.na'] || 'N/A'}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {literal['kpiVerificationCron.lastRun'] || 'Last Run'}:{' '}
                    {job.lastRunAt
                      ? new Date(job.lastRunAt).toLocaleString()
                      : literal['global.na'] || 'N/A'}
                  </Typography>
                </Box>

                <Stack alignItems={{ xs: 'flex-start', md: 'flex-end' }} spacing={1}>
                  <Chip
                    label={job.status}
                    color={
                      job.status === 'FAILED'
                        ? 'error'
                        : job.status === 'PAUSED'
                          ? 'warning'
                          : 'success'
                    }
                  />
                  <Stack direction="row" spacing={1}>
                    <Button size="small" variant="outlined" onClick={() => onRunNow(job.id)}>
                      {literal['kpiVerificationCron.runNow'] || 'Run Now'}
                    </Button>
                    {job.status === 'PAUSED' ? (
                      <Button size="small" variant="contained" onClick={() => onResumeCron(job.id)}>
                        {literal['kpiVerificationCron.resume'] || 'Resume'}
                      </Button>
                    ) : (
                      <Button size="small" variant="outlined" onClick={() => onPauseCron(job.id)}>
                        {literal['kpiVerificationCron.pause'] || 'Pause'}
                      </Button>
                    )}
                    <Button
                      size="small"
                      color="error"
                      variant="text"
                      onClick={() => onDeleteCron(job.id)}
                    >
                      {literal['global.delete'] || 'Delete'}
                    </Button>
                  </Stack>
                </Stack>
              </Stack>
            </Paper>
          ))}
        </Stack>
      )}
    </Box>
  )
}
