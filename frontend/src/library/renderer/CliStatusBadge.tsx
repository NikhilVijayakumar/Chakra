import { Box } from '@mui/material'
import { useCliConnection } from './hooks'
import { StatusDot } from './StatusDot'
import type { DotState } from './StatusDot'

/** Green dot when the CLI is connected and healthy, red when not. `showLabel` adds text beside it. */
export const CliStatusBadge = ({ pollMs = 0, showLabel = false }: { pollMs?: number; showLabel?: boolean }) => {
  const { state, result } = useCliConnection(pollMs)
  const dot: DotState = { checking: 'idle', connected: 'ok', unhealthy: 'warn', disconnected: 'error' }[state] as DotState
  const label = { checking: 'CLI: checking', connected: `CLI: connected${result ? ` v${result.version}` : ''}`, unhealthy: 'CLI: needs attention', disconnected: 'CLI: not connected' }[state]
  return (
    <Box component="span" data-testid="cli-badge" sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.75 }}>
      <StatusDot state={dot} label={label} />
      {showLabel && <span>{label}</span>}
    </Box>
  )
}
