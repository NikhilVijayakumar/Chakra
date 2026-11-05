import { Box } from '@mui/material'

export type DotState = 'ok' | 'error' | 'warn' | 'idle'
const colors: Record<DotState, string> = { ok: '#2e7d32', error: '#d32f2f', warn: '#ed6c02', idle: '#9e9e9e' }

/** Plain status dot: green ok, red error, amber warning, grey idle. */
export const StatusDot = ({ state, label, size = 10 }: { state: DotState; label?: string; size?: number }) => (
  <Box component="span" role="img" aria-label={label ?? state} title={label ?? state} data-state={state}
    sx={{ display: 'inline-block', width: size, height: size, borderRadius: '50%', bgcolor: colors[state], flexShrink: 0 }} />
)
