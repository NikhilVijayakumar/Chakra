import type { FC } from 'react'
import { Box, Button, Paper, Stack, Tab, Tabs, TextField, Typography } from '@mui/material'
import { spacing, useLanguage } from 'astra'
import type { ResolvedIncident } from '../repo/TriageIncidentResolutionRepo'

interface TriageIncidentResolutionViewProps {
  inProgressCount: number
  resolvedCount: number
  activeTab: 'in-progress' | 'resolved'
  incidents: ResolvedIncident[]
  selectedIncident: ResolvedIncident | null
  resolutionNotes: string
  onTabChange: (tab: 'in-progress' | 'resolved') => void
  onSelect: (incident: ResolvedIncident) => void
  onResolve: (id: string, notes: string) => void
  onReopen: (id: string, reason: string) => void
  onNotesChange: (notes: string) => void
  onRefresh: () => void
}

export const TriageIncidentResolutionView: FC<TriageIncidentResolutionViewProps> = ({
  inProgressCount,
  resolvedCount,
  activeTab,
  incidents,
  selectedIncident,
  resolutionNotes,
  onTabChange,
  onSelect,
  onResolve,
  onReopen,
  onNotesChange,
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
          {literal['triageIncidentResolution.title'] || 'Triage Incident Resolution'}
        </Typography>
        <Button variant="outlined" onClick={onRefresh}>
          {literal['global.refresh'] || 'Refresh'}
        </Button>
      </Stack>

      <Paper sx={{ mb: spacing.md }}>
        <Tabs
          value={activeTab}
          onChange={(_event, value) => onTabChange(value as 'in-progress' | 'resolved')}
        >
          <Tab
            value="in-progress"
            label={`${literal['triageIncidentResolution.inProgress'] || 'In Progress'} (${inProgressCount})`}
          />
          <Tab
            value="resolved"
            label={`${literal['triageIncidentResolution.resolved'] || 'Resolved'} (${resolvedCount})`}
          />
        </Tabs>
      </Paper>

      {incidents.length === 0 ? (
        <Paper sx={{ p: spacing.lg }}>
          <Typography>
            {literal['triageIncidentResolution.empty'] || 'No incidents in this tab'}
          </Typography>
        </Paper>
      ) : (
        <Stack spacing={spacing.md}>
          {incidents.map((incident) => (
            <Paper key={incident.id} sx={{ p: spacing.md }}>
              <Stack
                direction={{ xs: 'column', md: 'row' }}
                justifyContent="space-between"
                spacing={spacing.md}
              >
                <Box onClick={() => onSelect(incident)} sx={{ cursor: 'pointer' }}>
                  <Typography variant="subtitle1">{incident.topic}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {literal['global.source'] || 'Source'}: {incident.source}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {literal['global.receivedAt'] || 'Received'}:{' '}
                    {new Date(incident.receivedAt).toLocaleString()}
                  </Typography>
                  {incident.resolvedAt && (
                    <Typography variant="caption" color="text.secondary" display="block">
                      {literal['triageIncidentResolution.resolvedAt'] || 'Resolved At'}:{' '}
                      {new Date(incident.resolvedAt).toLocaleString()}
                    </Typography>
                  )}
                </Box>

                <Stack direction="row" spacing={1} alignItems="center">
                  {activeTab === 'in-progress' ? (
                    <Button variant="contained" onClick={() => onSelect(incident)}>
                      {literal['triageIncidentResolution.markResolved'] || 'Mark as Resolved'}
                    </Button>
                  ) : (
                    <Button
                      variant="outlined"
                      onClick={() => onReopen(incident.id, 'manual-reopen')}
                    >
                      {literal['triageIncidentResolution.reopen'] || 'Reopen'}
                    </Button>
                  )}
                </Stack>
              </Stack>
            </Paper>
          ))}
        </Stack>
      )}

      {selectedIncident && activeTab === 'in-progress' && (
        <Paper sx={{ mt: spacing.lg, p: spacing.md }}>
          <Typography variant="h6" sx={{ mb: spacing.sm }}>
            {literal['triageIncidentResolution.resolutionNotes'] || 'Resolution Notes'}
          </Typography>
          <TextField
            multiline
            minRows={4}
            fullWidth
            value={resolutionNotes}
            onChange={(event) => onNotesChange(event.target.value)}
          />
          <Stack direction="row" justifyContent="flex-end" sx={{ mt: spacing.sm }}>
            <Button
              variant="contained"
              onClick={() => onResolve(selectedIncident.id, resolutionNotes)}
            >
              {literal['triageIncidentResolution.confirmResolve'] || 'Confirm Resolve'}
            </Button>
          </Stack>
        </Paper>
      )}
    </Box>
  )
}
