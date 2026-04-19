import type { FC } from 'react'
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Drawer,
  Grid,
  Paper,
  Stack,
  TextField,
  Typography
} from '@mui/material'
import { spacing, useLanguage } from 'astra'
import type {
  EmployeeDashboard,
  EmployeeDashboardMetric,
  EmployeeIdentity
} from '../repo/VirtualEmployeeDashboardRepo'

interface VirtualEmployeeDashboardViewProps {
  dashboard: EmployeeDashboard | null
  employee: EmployeeIdentity | null
  metrics: EmployeeDashboardMetric[]
  selectedMetric: EmployeeDashboardMetric | null
  editingMetric: Partial<EmployeeDashboardMetric>
  editPanelOpen: boolean
  isLoading: boolean
  canEdit: boolean
  onMetricSelect: (metric: EmployeeDashboardMetric) => void
  onCloseEditPanel: () => void
  onUpdateTarget: (metricId: string, target: number) => void
  onSetEditField: <K extends keyof EmployeeDashboardMetric>(
    field: K,
    value: EmployeeDashboardMetric[K]
  ) => void
  onRefresh: () => void
}

export const VirtualEmployeeDashboardView: FC<VirtualEmployeeDashboardViewProps> = ({
  dashboard,
  employee,
  metrics,
  selectedMetric,
  editingMetric,
  editPanelOpen,
  isLoading,
  canEdit,
  onMetricSelect,
  onCloseEditPanel,
  onUpdateTarget,
  onSetEditField,
  onRefresh
}) => {
  const { literal } = useLanguage()

  return (
    <Box sx={{ p: spacing.xl, maxWidth: 1280, mx: 'auto' }}>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="flex-start"
        sx={{ mb: spacing.lg }}
      >
        <Box>
          <Typography variant="h4">
            {literal['virtualEmployeeDashboard.title'] || 'Virtual Employee Dashboard'}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: spacing.xs }}>
            {employee
              ? `${employee.name} • ${employee.department} • ${employee.role}`
              : literal['global.loading'] || 'Loading'}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {(literal['global.generatedAt'] || 'Generated at') +
              ': ' +
              (dashboard?.generatedAt
                ? new Date(dashboard.generatedAt).toLocaleString()
                : literal['global.na'] || 'N/A')}
          </Typography>
        </Box>
        <Button variant="outlined" disabled={isLoading} onClick={onRefresh}>
          {isLoading
            ? literal['global.loading'] || 'Loading'
            : literal['global.refresh'] || 'Refresh'}
        </Button>
      </Stack>

      <Grid container spacing={2}>
        {metrics.map((metric) => (
          <Grid key={metric.id} size={{ xs: 12, sm: 6, md: 4 }}>
            <Card sx={{ cursor: 'pointer', height: '100%' }} onClick={() => onMetricSelect(metric)}>
              <CardContent>
                <Stack
                  direction="row"
                  justifyContent="space-between"
                  alignItems="center"
                  sx={{ mb: spacing.xs }}
                >
                  <Typography variant="subtitle2">{metric.name}</Typography>
                  <Chip size="small" label={metric.department} />
                </Stack>
                <Typography variant="h5">
                  {metric.value} {metric.unit}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {(literal['virtualEmployeeDashboard.target'] || 'Target') + ': '}
                  {metric.target}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {(literal['virtualEmployeeDashboard.trend'] || 'Trend') + ': ' + metric.trend}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {dashboard?.assignments && dashboard.assignments.length > 0 && (
        <Paper sx={{ p: spacing.md, mt: spacing.lg }}>
          <Typography variant="h6" sx={{ mb: spacing.sm }}>
            {literal['virtualEmployeeDashboard.assignments'] || 'Assignments'}
          </Typography>
          <Stack spacing={spacing.sm}>
            {dashboard.assignments.map((assignment) => (
              <Box key={assignment.id}>
                <Typography variant="body2">{assignment.title}</Typography>
                <Typography variant="caption" color="text.secondary">
                  {assignment.status}
                </Typography>
              </Box>
            ))}
          </Stack>
        </Paper>
      )}

      <Drawer anchor="right" open={editPanelOpen} onClose={onCloseEditPanel}>
        <Box sx={{ width: 420, p: spacing.lg }}>
          <Typography variant="h6" sx={{ mb: spacing.md }}>
            {literal['virtualEmployeeDashboard.quickEdit'] || 'Quick Edit'}
          </Typography>

          {selectedMetric && (
            <Stack spacing={spacing.sm}>
              <TextField
                label={literal['virtualEmployeeDashboard.metric'] || 'Metric'}
                value={selectedMetric.name}
                InputProps={{ readOnly: true }}
                size="small"
              />
              <TextField
                label={literal['virtualEmployeeDashboard.currentTarget'] || 'Current Target'}
                value={selectedMetric.target}
                InputProps={{ readOnly: true }}
                size="small"
              />
              <TextField
                label={literal['virtualEmployeeDashboard.newTarget'] || 'New Target'}
                value={editingMetric.target ?? selectedMetric.target}
                size="small"
                type="number"
                onChange={(event) => onSetEditField('target', Number(event.target.value))}
                disabled={!canEdit}
                helperText={
                  canEdit
                    ? literal['virtualEmployeeDashboard.editEnabled'] || 'You can edit this target'
                    : literal['virtualEmployeeDashboard.editDisabled'] || 'Your role is read-only'
                }
              />

              <Stack direction="row" justifyContent="space-between" sx={{ mt: spacing.sm }}>
                <Button variant="outlined" onClick={onCloseEditPanel}>
                  {literal['global.cancel'] || 'Cancel'}
                </Button>
                <Button
                  variant="contained"
                  disabled={!canEdit}
                  onClick={() =>
                    onUpdateTarget(
                      selectedMetric.id,
                      Number(editingMetric.target ?? selectedMetric.target)
                    )
                  }
                >
                  {literal['global.save'] || 'Save'}
                </Button>
              </Stack>
            </Stack>
          )}
        </Box>
      </Drawer>
    </Box>
  )
}
