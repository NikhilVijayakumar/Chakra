import { Box, Button, Stack, TextField, Typography } from '@mui/material'
import { useCliConfig } from './hooks'
import { StatusDot } from './StatusDot'
import { SyncPanel } from './SyncPanel'
import { defaultStrings } from './strings'
import type { Strings } from './strings'

/** Default CLI-location screen. Build your own with `useCliConfig`. */
export const CliConfigScreen = ({ strings = defaultStrings, onSaved, error: outer }: { strings?: Strings; onSaved?: () => void; error?: string | null }) => {
  const c = useCliConfig(onSaved)
  const error = c.error ?? outer
  return (
    <Box sx={{ p: 3, maxWidth: 560, mx: 'auto' }} data-testid="cli-config">
      <Stack spacing={2}>
        <Typography variant="h5">{strings.cliConfigTitle}</Typography>
        <TextField label={strings.cliPathLabel} value={c.path} onChange={(e) => c.setPath(e.target.value)} fullWidth />
        <Stack direction="row" spacing={1}>
          <Button variant="outlined" onClick={() => void c.verify()} disabled={!c.path.trim()}>{strings.verify}</Button>
          <Button variant="contained" onClick={() => void c.save()} disabled={!c.canSave}>{strings.save}</Button>
        </Stack>
        {error && <Stack direction="row" spacing={1} alignItems="center"><StatusDot state="error" label={error} /><Typography variant="body2" color="error">{error}</Typography></Stack>}
        {c.result && (
          <Stack data-testid="verify-result">
            <Stack direction="row" spacing={1} alignItems="center"><StatusDot state="ok" label="connected" /><Typography>Version {c.result.version} (API {c.result.apiVersion})</Typography></Stack>
            {c.result.checks.map((k) => <Stack key={k.id} direction="row" spacing={1} alignItems="center"><StatusDot state={k.ok ? 'ok' : 'error'} label={`${k.id}: ${k.message}`} /><Typography variant="body2">{k.id}{k.ok ? '' : `: ${k.message}`}</Typography></Stack>)}
          </Stack>
        )}
        {c.saved && <Stack direction="row" spacing={1} alignItems="center"><StatusDot state="ok" label="saved" /><Typography variant="body2">Saved</Typography></Stack>}
        {c.saved && <SyncPanel strings={strings} />}
      </Stack>
    </Box>
  )
}
