import { useState, type FC } from 'react'
import { Box, Button, MenuItem, Paper, Select, Stack, Typography } from '@mui/material'
import { spacing, useLanguage } from 'astra'
import type { RoutedIncident } from '../repo/TriageIncidentRoutingRepo'

interface TriageIncidentRoutingViewProps {
  incidents: RoutedIncident[]
  isLoading: boolean
  error: string | null
  selectedIncident: RoutedIncident | null
  availableHandlers: string[]
  onSelect: (incident: RoutedIncident) => void
  onAssign: (
    id: string,
    assignedTo: string,
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  ) => void
  onEscalate: (id: string, reason: string) => void
  onRefresh: () => void
}

export const TriageIncidentRoutingView: FC<TriageIncidentRoutingViewProps> = ({
  incidents,
  isLoading,
  error,
  selectedIncident,
  availableHandlers,
  onSelect,
  onAssign,
  onEscalate,
  onRefresh
}) => {
  const { literal } = useLanguage()
  const [handlerById, setHandlerById] = useState<Record<string, string>>({})
  const [priorityById, setPriorityById] = useState<
    Record<string, 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'>
  >({})

  return (
    <Box sx={{ p: spacing.xl, maxWidth: 1200, mx: 'auto' }}>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        sx={{ mb: spacing.md }}
      >
        <Typography variant="h5">
          {literal['triageIncidentRouting.title'] || 'Triage Incident Routing'}
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

      {incidents.length === 0 ? (
        <Paper sx={{ p: spacing.lg }}>
          <Typography>
            {literal['triageIncidentRouting.empty'] || 'No pending incidents'}
          </Typography>
        </Paper>
      ) : (
        <Stack spacing={spacing.md}>
          {incidents.map((incident) => {
            const selectedHandler = handlerById[incident.id] ?? ''
            const selectedPriority = priorityById[incident.id] ?? 'MEDIUM'

            return (
              <Paper
                key={incident.id}
                sx={{
                  p: spacing.md,
                  borderWidth: selectedIncident?.id === incident.id ? 2 : 1,
                  borderStyle: 'solid',
                  borderColor: selectedIncident?.id === incident.id ? 'primary.main' : 'divider'
                }}
              >
                <Stack spacing={spacing.sm}>
                  <Box onClick={() => onSelect(incident)} sx={{ cursor: 'pointer' }}>
                    <Typography variant="subtitle1">{incident.topic}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {literal['global.source'] || 'Source'}: {incident.source}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {literal['global.receivedAt'] || 'Received'}:{' '}
                      {new Date(incident.receivedAt).toLocaleString()}
                    </Typography>
                  </Box>

                  <Stack
                    direction={{ xs: 'column', md: 'row' }}
                    spacing={spacing.sm}
                    alignItems="center"
                  >
                    <Select
                      size="small"
                      value={selectedHandler}
                      displayEmpty
                      onChange={(event) =>
                        setHandlerById((prev) => ({
                          ...prev,
                          [incident.id]: String(event.target.value)
                        }))
                      }
                      sx={{ minWidth: 220 }}
                    >
                      <MenuItem value="">
                        {literal['triageIncidentRouting.selectHandler'] || 'Select handler'}
                      </MenuItem>
                      {availableHandlers.map((handler) => (
                        <MenuItem key={handler} value={handler}>
                          {handler}
                        </MenuItem>
                      ))}
                    </Select>

                    <Select
                      size="small"
                      value={selectedPriority}
                      onChange={(event) =>
                        setPriorityById((prev) => ({
                          ...prev,
                          [incident.id]: event.target.value as
                            | 'LOW'
                            | 'MEDIUM'
                            | 'HIGH'
                            | 'CRITICAL'
                        }))
                      }
                      sx={{ minWidth: 160 }}
                    >
                      {(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as const).map((priority) => (
                        <MenuItem key={priority} value={priority}>
                          {priority}
                        </MenuItem>
                      ))}
                    </Select>

                    <Button
                      variant="contained"
                      disabled={!selectedHandler}
                      onClick={() => onAssign(incident.id, selectedHandler, selectedPriority)}
                    >
                      {literal['triageIncidentRouting.assign'] || 'Assign'}
                    </Button>

                    <Button
                      variant="outlined"
                      color="warning"
                      onClick={() => onEscalate(incident.id, 'manual-escalation')}
                    >
                      {literal['triageIncidentRouting.escalate'] || 'Escalate'}
                    </Button>
                  </Stack>
                </Stack>
              </Paper>
            )
          })}
        </Stack>
      )}
    </Box>
  )
}
