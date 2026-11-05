import { Alert, Box, Button, Stack, TextField, Typography } from '@mui/material'
import { useForgotPassword } from './hooks'
import { defaultStrings } from './strings'
import type { Strings } from './strings'

/** Default forgot-password flow. Build your own with `useForgotPassword`. */
export const ForgotPassword = ({ strings = defaultStrings, onBack }: { strings?: Strings; onBack: () => void }) => {
  const f = useForgotPassword()
  return (
    <Box sx={{ minHeight: '100vh', display: 'grid', placeItems: 'center', p: 3 }} data-testid="forgot">
      <Stack spacing={2} sx={{ width: 360 }}>
        <Typography variant="h5">{strings.forgot}</Typography>
        {f.step === 'email' && <>
          <TextField label={strings.email} type="email" value={f.email} onChange={(e) => f.setEmail(e.target.value)} />
          <Button variant="contained" disabled={f.busy || !f.email} onClick={() => void f.sendOtp()}>{strings.sendOtp}</Button>
        </>}
        {f.step === 'otp' && <>
          <TextField label={strings.otp} value={f.otp} onChange={(e) => f.setOtp(e.target.value)} inputProps={{ inputMode: 'numeric' }} />
          <Button variant="contained" disabled={f.busy || !f.otp} onClick={() => void f.verifyOtp()}>{strings.verifyOtp}</Button>
          <Button onClick={() => void f.sendOtp()} disabled={f.busy}>{strings.sendOtp}</Button>
        </>}
        {f.step === 'password' && <>
          <TextField label={strings.newPassword} type="password" value={f.password} onChange={(e) => f.setPassword(e.target.value)} autoComplete="new-password" />
          <Button variant="contained" disabled={f.busy || !f.password} onClick={() => void f.reset()}>{strings.resetPassword}</Button>
        </>}
        {f.step === 'done' && <Alert severity="success">{strings.resetDone}</Alert>}
        {f.error && <Alert severity="error">{f.error}</Alert>}
        <Button onClick={onBack}>{strings.back}</Button>
      </Stack>
    </Box>
  )
}
