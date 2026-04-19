import type { FC } from 'react'
import { Box, Button, Chip, Paper, Stack, Typography } from '@mui/material'
import { spacing, useLanguage } from 'astra'
import type { KpiBreachAlert } from '../repo/KpiBreachAlertingRepo'

interface KpiBreachAlertingViewProps {
  breaches: KpiBreachAlert[]
  isLoading: boolean
  error: string | null
  filterSeverity: 'ALL' | 'CRITICAL' | 'WARNING'
  statusFilter: 'active' | 'acknowledged' | 'resolved'
  onFilterSeverity: (severity: 'ALL' | 'CRITICAL' | 'WARNING') => void
  onFilterStatus: (status: 'active' | 'acknowledged' | 'resolved') => void
  onAcknowledge: (id: string) => void
  onResolve: (id: string) => void
  onRefresh: () => void
}

export const KpiBreachAlertingView: FC<KpiBreachAlertingViewProps> = ({
  breaches,
  isLoading,
  error,
  filterSeverity,
  statusFilter,
  onFilterSeverity,
  onFilterStatus,
  onAcknowledge,
  onResolve,
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
          {literal['kpiBreachAlerting.title'] || 'KPI Breach Alerting'}
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
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={spacing.md}>
          <Stack direction="row" spacing={1}>
            {(['ALL', 'CRITICAL', 'WARNING'] as const).map((severity) => (
              <Chip
                key={severity}
                label={literal[`kpiBreachAlerting.severity.${severity.toLowerCase()}`] || severity}
                color={filterSeverity === severity ? 'primary' : 'default'}
                variant={filterSeverity === severity ? 'filled' : 'outlined'}
                onClick={() => onFilterSeverity(severity)}
              />
            ))}
          </Stack>
          <Stack direction="row" spacing={1}>
            {(['active', 'acknowledged', 'resolved'] as const).map((status) => (
              <Chip
                key={status}
                label={literal[`kpiBreachAlerting.status.${status}`] || status}
                color={statusFilter === status ? 'primary' : 'default'}
                variant={statusFilter === status ? 'filled' : 'outlined'}
                onClick={() => onFilterStatus(status)}
              />
            ))}
          </Stack>
        </Stack>
      </Paper>

      {breaches.length === 0 ? (
        <Paper sx={{ p: spacing.lg }}>
          <Typography>{literal['kpiBreachAlerting.empty'] || 'No KPI breaches'}</Typography>
        </Paper>
      ) : (
        <Stack spacing={spacing.md}>
          {breaches.map((breach) => (
            <Paper key={breach.id} sx={{ p: spacing.md }}>
              <Stack
                direction={{ xs: 'column', md: 'row' }}
                justifyContent="space-between"
                spacing={spacing.md}
              >
                <Box>
                  <Typography variant="h6">{breach.kpiName}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {literal['kpiBreachAlerting.currentValue'] || 'Current'}: {breach.currentValue}
                    {' | '}
                    {literal['kpiBreachAlerting.threshold'] || 'Threshold'}: {breach.threshold}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {literal['kpiBreachAlerting.linkedAgent'] || 'Agent'}: {breach.linkedAgent}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {literal['kpiBreachAlerting.detectedAt'] || 'Detected'}:{' '}
                    {new Date(breach.detectedAt).toLocaleString()}
                  </Typography>
                </Box>
                <Stack alignItems={{ xs: 'flex-start', md: 'flex-end' }} spacing={1}>
                  <Chip
                    label={breach.severity}
                    color={breach.severity === 'CRITICAL' ? 'error' : 'warning'}
                  />
                  {breach.status === 'active' && (
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => onAcknowledge(breach.id)}
                    >
                      {literal['kpiBreachAlerting.acknowledge'] || 'Acknowledge'}
                    </Button>
                  )}
                  {breach.status !== 'resolved' && (
                    <Button size="small" variant="contained" onClick={() => onResolve(breach.id)}>
                      {literal['kpiBreachAlerting.resolve'] || 'Resolve'}
                    </Button>
                  )}
                </Stack>
              </Stack>
            </Paper>
          ))}
        </Stack>
      )}
    </Box>
  )
}
