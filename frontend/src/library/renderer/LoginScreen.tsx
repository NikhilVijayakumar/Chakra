import { Alert, Box, Button, Link, Stack, TextField, Typography } from '@mui/material'
import type { User } from '../shared/contract'
import { useLogin } from './hooks'
import { defaultStrings } from './strings'
import type { Strings } from './strings'

/** Default login screen. Build your own with `useLogin`. */
export const LoginScreen = ({ strings = defaultStrings, onLogin, onForgot }: { strings?: Strings; onLogin: (u: User) => void; onForgot: () => void }) => {
  const l = useLogin(onLogin, strings)
  if (l.accessDenied) return (
    <Box sx={{ minHeight: '100vh', display: 'grid', placeItems: 'center', p: 3 }}>
      <Stack spacing={2} sx={{ maxWidth: 360 }}>
        <Typography component="h1" variant="h5">{strings.noAccessTitle}</Typography>
        <Typography>{strings.noAccessMessage}</Typography>
        <Button onClick={l.clearAccessDenied}>{strings.back}</Button>
      </Stack>
    </Box>
  )
  return (
    <Box sx={{ minHeight: '100vh', display: 'grid', placeItems: 'center', p: 3 }} data-testid="login">
      <Stack component="form" spacing={2} sx={{ width: 360 }} onSubmit={(e) => { e.preventDefault(); void l.submit() }}>
        <Typography variant="h5">{strings.loginTitle}</Typography>
        <TextField label={strings.email} type="email" value={l.email} onChange={(e) => l.setEmail(e.target.value)} autoComplete="username" />
        <TextField label={strings.password} type="password" value={l.password} onChange={(e) => l.setPassword(e.target.value)} autoComplete="current-password" />
        {l.lockSeconds > 0 && <Alert severity="warning">{strings.locked.replace('{s}', String(l.lockSeconds))}</Alert>}
        {l.error && l.lockSeconds <= 0 && <Alert severity="error">{l.error}</Alert>}
        <Button type="submit" variant="contained" disabled={l.busy || l.lockSeconds > 0}>{strings.signIn}</Button>
        <Link component="button" type="button" onClick={onForgot}>{strings.forgot}</Link>
      </Stack>
    </Box>
  )
}
