import { FC, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Drawer,
  MenuItem,
  Paper,
  Select,
  Snackbar,
  TextField,
  Typography,
  useTheme as useMuiTheme
} from '@mui/material'
import { AppStateHandler, StateType, useLanguage } from 'astra'
import { spacing } from 'astra'
import { useLifecycle } from 'prana/ui/state/LifecycleProvider'
import { useDashboardViewModel } from '../viewmodel/useDashboardViewModel'
import { DashboardKpi } from '../repo/DashboardRepo'

const normalize = (value: string): string => value.trim().toLowerCase()

const buildSuggestion = (
  label: string,
  detail: string,
  literal: Record<string, string>
): string => {
  return `${literal['dashboard.quickEdit.suggestionPrefix']} "${label}" (${detail}), ${literal['dashboard.quickEdit.suggestionSuffix']}`
}

export const DashboardContainer: FC = () => {
  const muiTheme = useMuiTheme()
  const { literal } = useLanguage()
  const { dashboardState, reload } = useDashboardViewModel()
  const lifecycle = useLifecycle()
  const payload = dashboardState.data ?? null
  const isLoading = dashboardState.state === StateType.LOADING

  const [quickEditKpi, setQuickEditKpi] = useState<DashboardKpi | null>(null)
  const [selectedAgentId, setSelectedAgentId] = useState<string>('')
  const [selectedLifecycleKpiId, setSelectedLifecycleKpiId] = useState<string>('')
  const [proposedGoal, setProposedGoal] = useState<string>('')
  const [proposedKpiTarget, setProposedKpiTarget] = useState<string>('')
  const [toast, setToast] = useState<{ severity: 'success' | 'error'; message: string } | null>(
    null
  )

  const selectedProfile =
    lifecycle.profiles.find((entry) => entry.agentId === selectedAgentId) ?? null
  const selectedLifecycleKpi =
    lifecycle.kpis.find((entry) => entry.id === selectedLifecycleKpiId) ?? null

  const openQuickEdit = (kpi: DashboardKpi) => {
    const matched =
      lifecycle.kpis.find((entry) => normalize(entry.name) === normalize(kpi.label)) ??
      lifecycle.kpis.find(
        (entry) =>
          normalize(kpi.label).includes(normalize(entry.name)) ||
          normalize(entry.name).includes(normalize(kpi.label))
      ) ??
      null

    const agentId = matched?.linkedAgents[0] ?? lifecycle.profiles[0]?.agentId ?? ''
    const profile = lifecycle.profiles.find((entry) => entry.agentId === agentId) ?? null

    setQuickEditKpi(kpi)
    setSelectedAgentId(agentId)
    setSelectedLifecycleKpiId(matched?.id ?? '')
    setProposedGoal(profile?.goal ?? '')
    setProposedKpiTarget(matched?.target ?? '')
  }

  const closeQuickEdit = () => {
    setQuickEditKpi(null)
  }

  const commitQuickEdit = async () => {
    if (!selectedProfile) {
      setToast({ severity: 'error', message: literal['dashboard.quickEdit.selectProfileRequired'] })
      return
    }

    lifecycle.updateProfileLocal(selectedProfile.agentId, { goal: proposedGoal })
    const profileResult = await lifecycle.saveProfile(selectedProfile.agentId)
    if (!profileResult.success) {
      setToast({
        severity: 'error',
        message: profileResult.error ?? literal['dashboard.quickEdit.profileSaveFailed']
      })
      return
    }

    if (selectedLifecycleKpiId) {
      lifecycle.updateKpiLocal(selectedLifecycleKpiId, { target: proposedKpiTarget })
      const kpiResult = await lifecycle.saveKpi(selectedLifecycleKpiId)
      if (!kpiResult.success) {
        setToast({
          severity: 'error',
          message: kpiResult.error ?? literal['dashboard.quickEdit.kpiSaveFailed']
        })
        return
      }
    }

    setToast({ severity: 'success', message: literal['dashboard.quickEdit.commitSuccess'] })
    closeQuickEdit()
  }

  return (
    <AppStateHandler appState={dashboardState}>
      <Box sx={{ p: spacing.xl, maxWidth: '1000px', mx: 'auto' }}>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            mb: spacing.xl
          }}
        >
          <Box>
            <Typography variant="h3" sx={{ color: muiTheme.palette.text.primary, mb: spacing.xs }}>
              {literal['dashboard.title']}
            </Typography>
            <Typography variant="body1" sx={{ color: muiTheme.palette.text.secondary }}>
              {literal['dashboard.subtitle']}
            </Typography>
          </Box>
          <Button variant="outlined" size="small" onClick={reload} disabled={isLoading}>
            {isLoading ? literal['dashboard.refreshing'] : literal['dashboard.refresh']}
          </Button>
        </Box>

        {payload && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: spacing.md }}>
            <Paper sx={{ p: spacing.lg }} elevation={0}>
              <Typography variant="micro" sx={{ color: muiTheme.palette.text.secondary }}>
                GENERATED
              </Typography>
              <Typography variant="body2" sx={{ color: muiTheme.palette.text.primary }}>
                {new Date(payload.generatedAt).toLocaleString()}
              </Typography>
            </Paper>

            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: spacing.md }}>
              {payload.kpis.map((kpi) => (
                <Paper
                  key={kpi.id}
                  sx={{ p: spacing.md, flex: '1 1 calc(50% - 16px)' }}
                  elevation={0}
                >
                  <Typography variant="micro" sx={{ color: muiTheme.palette.text.secondary }}>
                    {kpi.label}
                  </Typography>
                  <Typography
                    variant="h4"
                    sx={{ color: muiTheme.palette.text.primary, mt: spacing.xs }}
                  >
                    {kpi.value}
                  </Typography>
                  <Typography
                    variant="captionBold"
                    sx={{
                      color:
                        kpi.status === 'healthy'
                          ? muiTheme.palette.success.main
                          : kpi.status === 'watch'
                            ? muiTheme.palette.warning.main
                            : muiTheme.palette.error.main
                    }}
                  >
                    {kpi.status.toUpperCase()}
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{
                      color: muiTheme.palette.text.secondary,
                      display: 'block',
                      mt: spacing.xs
                    }}
                  >
                    {kpi.detail}
                  </Typography>
                  {(kpi.status === 'watch' || kpi.status === 'critical') && (
                    <Button
                      size="small"
                      variant="text"
                      sx={{ mt: spacing.xs }}
                      onClick={() => openQuickEdit(kpi)}
                    >
                      {literal['dashboard.quickEdit.refine']}
                    </Button>
                  )}
                </Paper>
              ))}
            </Box>

            <Paper sx={{ p: spacing.lg }} elevation={0}>
              <Typography
                variant="h6"
                sx={{ color: muiTheme.palette.text.primary, mb: spacing.sm }}
              >
                Highlights
              </Typography>
              {payload.highlights.map((line) => (
                <Typography
                  key={line}
                  variant="body2"
                  sx={{ color: muiTheme.palette.text.secondary, mb: spacing.xs }}
                >
                  {line}
                </Typography>
              ))}
            </Paper>
          </Box>
        )}

        <Drawer anchor="right" open={Boolean(quickEditKpi)} onClose={closeQuickEdit}>
          <Box
            sx={{
              width: 480,
              p: spacing.lg,
              display: 'flex',
              flexDirection: 'column',
              gap: spacing.md
            }}
          >
            <Typography variant="h6">{literal['dashboard.quickEdit.title']}</Typography>
            <Typography variant="body2" color="text.secondary">
              {literal['dashboard.quickEdit.triggeredBy']}:{' '}
              {quickEditKpi?.label ?? literal['global.na']}
            </Typography>

            {quickEditKpi && (
              <Alert severity="warning">
                {literal['dashboard.quickEdit.kpiSignal']} {quickEditKpi.status.toUpperCase()}:{' '}
                {quickEditKpi.detail}
              </Alert>
            )}

            <Select
              value={selectedAgentId}
              size="small"
              onChange={(event) => setSelectedAgentId(event.target.value)}
            >
              {lifecycle.profiles.map((entry) => (
                <MenuItem key={entry.agentId} value={entry.agentId}>
                  {entry.name} ({entry.role})
                </MenuItem>
              ))}
            </Select>

            {selectedProfile && (
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: spacing.sm }}>
                <TextField
                  label={literal['settings.lifecycle.currentGoal']}
                  value={selectedProfile.goal}
                  size="small"
                  multiline
                  minRows={4}
                  InputProps={{ readOnly: true }}
                />
                <TextField
                  label={literal['settings.lifecycle.proposedGoal']}
                  value={proposedGoal}
                  size="small"
                  multiline
                  minRows={4}
                  onChange={(event) => setProposedGoal(event.target.value)}
                />
              </Box>
            )}

            <Select
              value={selectedLifecycleKpiId}
              size="small"
              onChange={(event) => {
                const nextId = event.target.value
                setSelectedLifecycleKpiId(nextId)
                const nextKpi = lifecycle.kpis.find((entry) => entry.id === nextId)
                setProposedKpiTarget(nextKpi?.target ?? '')
              }}
            >
              {lifecycle.kpis.map((entry) => (
                <MenuItem key={entry.id} value={entry.id}>
                  {entry.name}
                </MenuItem>
              ))}
            </Select>

            {selectedLifecycleKpi && (
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: spacing.sm }}>
                <TextField
                  label={literal['settings.lifecycle.currentTarget']}
                  value={selectedLifecycleKpi.target}
                  size="small"
                  InputProps={{ readOnly: true }}
                />
                <TextField
                  label={literal['dashboard.quickEdit.proposedKpiTarget']}
                  value={proposedKpiTarget}
                  size="small"
                  onChange={(event) => setProposedKpiTarget(event.target.value)}
                />
              </Box>
            )}

            <Alert severity="info">
              {literal['dashboard.quickEdit.agentSuggestion']}:{' '}
              {buildSuggestion(quickEditKpi?.label ?? 'KPI', quickEditKpi?.detail ?? '', literal)}
            </Alert>
            <Button
              variant="outlined"
              onClick={() => {
                if (!selectedProfile || !quickEditKpi) {
                  return
                }
                setProposedGoal(
                  `${selectedProfile.goal}\n\n${buildSuggestion(quickEditKpi.label, quickEditKpi.detail, literal)}`
                )
              }}
            >
              {literal['dashboard.quickEdit.applySuggestion']}
            </Button>

            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Button variant="outlined" onClick={closeQuickEdit}>
                {literal['global.cancel']}
              </Button>
              <Button variant="contained" onClick={() => void commitQuickEdit()}>
                {literal['dashboard.quickEdit.explicitCommit']}
              </Button>
            </Box>
          </Box>
        </Drawer>

        <Snackbar open={Boolean(toast)} autoHideDuration={2600} onClose={() => setToast(null)}>
          <Alert severity={toast?.severity ?? 'success'} onClose={() => setToast(null)}>
            {toast?.message ?? ''}
          </Alert>
        </Snackbar>
      </Box>
    </AppStateHandler>
  )
}
