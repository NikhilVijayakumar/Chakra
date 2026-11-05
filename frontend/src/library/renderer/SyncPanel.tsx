import { Button, Stack, Typography } from '@mui/material'
import type { SyncStatus } from '../shared/contract'
import { useSync } from './hooks'
import { StatusDot } from './StatusDot'
import { defaultStrings } from './strings'
import type { Strings } from './strings'

/** Sync status + manual sync. Build your own with `useSync`. */
export const SyncPanel = ({ strings = defaultStrings, onChange }: { strings?: Strings; onChange?: (s: SyncStatus | null) => void }) => {
  const s = useSync(onChange)
  return (
    <Stack spacing={1} data-testid="sync-panel">
      {s.status && <Stack direction="row" spacing={1} alignItems="center"><StatusDot state={s.status.synced ? 'ok' : 'error'} label={s.status.synced ? 'synced' : 'not synced'} /><Typography>{s.status.synced ? 'Synced' : 'Not synced'} · pending updates: {s.status.pending}</Typography></Stack>}
      {s.status?.contents.filter((c) => !c.synced).map((c) => <Stack key={c.id} direction="row" spacing={1} alignItems="center"><StatusDot state="error" label={c.error ?? 'not synced'} size={8} /><Typography variant="body2" color="text.secondary">{c.id}{c.error ? `: ${c.error}` : ''}</Typography></Stack>)}
      {s.last?.results.filter((r) => !r.ok).map((r) => <Stack key={r.target} direction="row" spacing={1} alignItems="center"><StatusDot state="warn" label={r.message ?? 'failed'} size={8} /><Typography variant="body2">{r.target}: {r.message}</Typography></Stack>)}
      {s.error && <Stack direction="row" spacing={1} alignItems="center"><StatusDot state="error" label={s.error} /><Typography variant="body2" color="error">{s.error}</Typography></Stack>}
      <Button variant="contained" disabled={s.busy} onClick={() => void s.run()}>{s.busy ? strings.syncing : strings.syncNow}</Button>
    </Stack>
  )
}
