import { FC, useState } from 'react'
import {
  Box,
  CircularProgress,
  Typography,
  Paper,
  List,
  ListItemButton,
  ListItemText,
  Chip,
  Button,
  Snackbar,
  Alert
} from '@mui/material'
import { spacing } from 'astra'
import type { KpiWithStatus, KpiDefinition } from '../repo/KpisRepo'

interface KpisListViewProps {
  kpis: KpiWithStatus[]
  selectedKpiId: string | null
  onSelectKpi: (kpi: KpiWithStatus) => void
}

export const KpisListView: FC<KpisListViewProps> = ({ kpis, selectedKpiId, onSelectKpi }) => {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: spacing.sm }}>
      <Typography variant="h6">KPIs</Typography>
      <List sx={{ p: 0 }}>
        {kpis.map((kpiWithStatus) => (
          <ListItemButton
            key={kpiWithStatus.kpi.uid}
            selected={selectedKpiId === kpiWithStatus.kpi.uid}
            onClick={() => onSelectKpi(kpiWithStatus)}
            sx={{ borderRadius: 1, mb: 0.5 }}
          >
            <ListItemText
              primary={
                <Box
                  sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                >
                  <Typography variant="body1">{kpiWithStatus.kpi.name}</Typography>
                  {kpiWithStatus.syncStatus === 'SYNCED' && (
                    <Chip label="In Vault" size="small" color="success" variant="outlined" />
                  )}
                  {kpiWithStatus.syncStatus === 'NEW' && (
                    <Chip label="New" size="small" color="warning" variant="outlined" />
                  )}
                </Box>
              }
              secondary={`Unit: ${kpiWithStatus.kpi.unit}`}
            />
          </ListItemButton>
        ))}
      </List>
    </Box>
  )
}

interface KpiDetailViewProps {
  kpiWithStatus: KpiWithStatus | null
  isSaving: boolean
  onSaveToVault: (kpi: KpiDefinition) => Promise<void>
}

export const KpiDetailView: FC<KpiDetailViewProps> = ({
  kpiWithStatus,
  isSaving,
  onSaveToVault
}) => {
  const [banner, setBanner] = useState<{ severity: 'success' | 'error'; message: string } | null>(
    null
  )

  if (!kpiWithStatus) {
    return (
      <Box sx={{ p: spacing.xl }}>
        <Typography color="text.secondary">Select a KPI to view details</Typography>
      </Box>
    )
  }

  const { kpi, syncStatus } = kpiWithStatus

  const handleSaveToVault = async () => {
    await onSaveToVault(kpi)
    setBanner({ severity: 'success', message: 'KPI saved to vault' })
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: spacing.md }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h5">{kpi.name}</Typography>
        <Box sx={{ display: 'flex', gap: spacing.sm, alignItems: 'center' }}>
          {syncStatus === 'SYNCED' ? (
            <Chip label="In Vault" color="success" variant="outlined" />
          ) : syncStatus === 'NEW' ? (
            <Chip label="New" color="warning" variant="outlined" />
          ) : (
            <Button variant="contained" onClick={handleSaveToVault} disabled={isSaving}>
              {isSaving ? <CircularProgress size={18} color="inherit" /> : 'Save to Vault'}
            </Button>
          )}
        </Box>
      </Box>

      <Paper sx={{ p: spacing.md }}>
        <Typography variant="subtitle2" color="text.secondary">
          Description
        </Typography>
        <Typography>{kpi.description}</Typography>
      </Paper>

      <Paper sx={{ p: spacing.md }}>
        <Typography variant="subtitle2" color="text.secondary">
          Unit
        </Typography>
        <Typography>{kpi.unit}</Typography>
      </Paper>

      <Paper sx={{ p: spacing.md }}>
        <Typography variant="subtitle2" color="text.secondary">
          Target
        </Typography>
        <Typography>{kpi.target}</Typography>
      </Paper>

      <Paper sx={{ p: spacing.md }}>
        <Typography variant="subtitle2" color="text.secondary">
          Current Value
        </Typography>
        <Typography>{kpi.value}</Typography>
      </Paper>

      <Paper sx={{ p: spacing.md }}>
        <Typography variant="subtitle2" color="text.secondary">
          Goal Mapping
        </Typography>
        <Typography>{kpi.goalMapping}</Typography>
      </Paper>

      {kpi.formula && (
        <Paper sx={{ p: spacing.md }}>
          <Typography variant="subtitle2" color="text.secondary">
            Formula
          </Typography>
          <Typography>{kpi.formula}</Typography>
        </Paper>
      )}

      {kpi.frequencyOfCheck && (
        <Paper sx={{ p: spacing.md }}>
          <Typography variant="subtitle2" color="text.secondary">
            Frequency
          </Typography>
          <Typography>{kpi.frequencyOfCheck}</Typography>
        </Paper>
      )}

      {kpi.responsibleAgentRole && (
        <Paper sx={{ p: spacing.md }}>
          <Typography variant="subtitle2" color="text.secondary">
            Responsible Agent
          </Typography>
          <Typography>{kpi.responsibleAgentRole}</Typography>
        </Paper>
      )}

      {kpi.thresholds && (
        <Paper sx={{ p: spacing.md }}>
          <Typography variant="subtitle2" color="text.secondary">
            Thresholds
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: spacing.xs }}>
            {kpi.thresholds.critical && (
              <Typography>
                <strong>Critical:</strong> {kpi.thresholds.critical}
              </Typography>
            )}
            {kpi.thresholds.warning && (
              <Typography>
                <strong>Warning:</strong> {kpi.thresholds.warning}
              </Typography>
            )}
            {kpi.thresholds.optimal && (
              <Typography>
                <strong>Optimal:</strong> {kpi.thresholds.optimal}
              </Typography>
            )}
          </Box>
        </Paper>
      )}

      <Snackbar open={Boolean(banner)} autoHideDuration={2600} onClose={() => setBanner(null)}>
        <Alert severity={banner?.severity ?? 'success'} onClose={() => setBanner(null)}>
          {banner?.message ?? ''}
        </Alert>
      </Snackbar>
    </Box>
  )
}
