import { Box, Button, CircularProgress, List, ListItem, ListItemText, Stack, Typography } from '@mui/material'
import type { ReactNode } from 'react'
import { StatusDot } from './StatusDot'
import type { DotState } from './StatusDot'

export type StageState = 'pending' | 'running' | 'ok' | 'error'
export interface Stage {
  id: string
  label: string
  state: StageState
  detail?: string
}

const dot: Record<Exclude<StageState, 'running'>, DotState> = { pending: 'idle', ok: 'ok', error: 'error' }

/** One row per stage: a dot (green/red/grey, spinner while running) and the label. */
export const BootScreen = ({ title, stages, error, actions }: { title: string; stages: Stage[]; error?: string | null; actions?: ReactNode }) => (
  <Box sx={{ minHeight: '100vh', display: 'grid', placeItems: 'center', p: 3 }} data-testid="boot">
    <Stack spacing={2} sx={{ width: 480, maxWidth: '100%' }}>
      <Typography variant="h5">{title}</Typography>
      <List dense>
        {stages.map((s) => (
          <ListItem key={s.id} data-testid={`stage-${s.id}`} data-state={s.state} sx={{ gap: 1.5 }}>
            {s.state === 'running' ? <CircularProgress size={12} /> : <StatusDot state={dot[s.state]} label={`${s.label}: ${s.state}`} />}
            <ListItemText primary={s.label} secondary={s.detail} />
          </ListItem>
        ))}
      </List>
      {error && <Typography variant="body2" color="error" data-testid="boot-error">{error}</Typography>}
      {actions}
    </Stack>
  </Box>
)

export const RetryButton = ({ label, onClick }: { label: string; onClick: () => void }) => (
  <Button variant="outlined" onClick={onClick}>{label}</Button>
)
