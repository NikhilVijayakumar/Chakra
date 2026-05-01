import { FC } from 'react'
import { Box, Button, TextField, Typography, Alert, CircularProgress, useTheme, useMediaQuery } from '@mui/material'
import { motion } from 'framer-motion'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'

type ForgotPasswordStep = 'email' | 'verification' | 'reset'

interface ForgotPasswordViewProps {
  step: ForgotPasswordStep
  email: string
  verificationCode: string
  newPassword: string
  confirmPassword: string
  isSubmitting: boolean
  error: string | null
  successMessage: string | null
  emailError: string | null
  verificationCodeError: string | null
  passwordError: string | null
  onEmailChange: (email: string) => void
  onVerificationCodeChange: (code: string) => void
  onNewPasswordChange: (password: string) => void
  onConfirmPasswordChange: (password: string) => void
  onSubmit: () => void
  onBack: () => void
  onResendCode: () => void
}

/**
 * ForgotPasswordView
 * 
 * Three-step forgot password flow:
 * 1. Enter email
 * 2. Enter verification code (sent to email)
 * 3. Reset password
 * 
 * Uses Astra theme with animations
 */
export const ForgotPasswordView: FC<ForgotPasswordViewProps> = ({
  step,
  email,
  verificationCode,
  newPassword,
  confirmPassword,
  isSubmitting,
  error,
  successMessage,
  emailError,
  verificationCodeError,
  passwordError,
  onEmailChange,
  onVerificationCodeChange,
  onNewPasswordChange,
  onConfirmPasswordChange,
  onSubmit,
  onBack,
  onResendCode
}) => {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))

  return (
    <Box
      sx={{
        display: 'flex',
        width: '100%',
        minHeight: '100vh',
        bgcolor: theme.palette.background.default
      }}
    >
      {/* Left Panel */}
      {!isMobile && (
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          style={{ flex: 2, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}
        >
          <Box sx={{ p: 8, maxWidth: 600 }}>
            <Typography
              sx={{
                fontSize: '0.6875rem',
                fontWeight: 600,
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
                color: theme.palette.primary.main,
                mb: 2
              }}
            >
              Account Recovery
            </Typography>
            <Typography variant="h3" sx={{ fontWeight: 700, mb: 3, letterSpacing: '-0.03em' }}>
              Reset your password
            </Typography>
            <Typography
              sx={{
                fontSize: '1rem',
                lineHeight: 1.6,
                color: theme.palette.text.secondary,
                maxWidth: 400
              }}
            >
              We'll help you regain access to your account by verifying your email address and
              setting a new password.
            </Typography>
          </Box>
        </motion.div>
      )}

      {/* Right Panel - Form */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        style={{
          flex: 1,
          minWidth: isMobile ? 0 : 420,
          maxWidth: 480,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: isMobile ? 24 : 48,
          borderLeft: isMobile ? 'none' : `1px solid ${theme.palette.divider}`,
          borderTop: isMobile ? `1px solid ${theme.palette.divider}` : 'none'
        }}
      >
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={onBack}
          sx={{
            alignSelf: 'flex-start',
            mb: 4,
            textTransform: 'none',
            color: theme.palette.text.secondary,
            '&:hover': { color: theme.palette.text.primary }
          }}
        >
          Back to Login
        </Button>

        <Typography variant="h5" sx={{ fontWeight: 600, mb: 1 }}>
          {step === 'email' && 'Forgot Password'}
          {step === 'verification' && 'Verify Email'}
          {step === 'reset' && 'New Password'}
        </Typography>

        <Typography variant="body2" sx={{ color: theme.palette.text.secondary, mb: 4 }}>
          {step === 'email' && 'Enter your email address to receive a verification code'}
          {step === 'verification' && 'We sent a code to your email. Enter it to continue.'}
          {step === 'reset' && 'Create a strong password for your account'}
        </Typography>

        {error && <Alert severity="error" sx={{ mb: 2 }} >{error}</Alert>}
        {successMessage && <Alert severity="success" sx={{ mb: 2 }}>{successMessage}</Alert>}

        {/* Step 1: Email */}
        {step === 'email' && (
          <>
            <TextField
              label="Email Address"
              type="email"
              placeholder="you@company.com"
              value={email}
              onChange={(e) => onEmailChange(e.target.value)}
              error={!!emailError}
              helperText={emailError}
              disabled={isSubmitting}
              fullWidth
              sx={{ mb: 3 }}
            />
            <Button
              variant="contained"
              color="primary"
              fullWidth
              disabled={isSubmitting || !email}
              onClick={onSubmit}
              sx={{ height: 44 }}
            >
              {isSubmitting ? <CircularProgress size={24} /> : 'Send Verification Code'}
            </Button>
          </>
        )}

        {/* Step 2: Verification */}
        {step === 'verification' && (
          <>
            <TextField
              label="Verification Code"
              placeholder="000000"
              value={verificationCode}
              onChange={(e) => onVerificationCodeChange(e.target.value)}
              error={!!verificationCodeError}
              helperText={verificationCodeError}
              disabled={isSubmitting}
              fullWidth
              sx={{ mb: 2 }}
            />
            <Typography variant="caption" sx={{ mb: 3, color: theme.palette.text.secondary }}>
              Check your email for the 6-digit code
            </Typography>
            <Button
              variant="contained"
              color="primary"
              fullWidth
              disabled={isSubmitting || !verificationCode}
              onClick={onSubmit}
              sx={{ height: 44, mb: 2 }}
            >
              {isSubmitting ? <CircularProgress size={24} /> : 'Verify Code'}
            </Button>
            <Button
              variant="text"
              fullWidth
              onClick={onResendCode}
              disabled={isSubmitting}
              sx={{ textTransform: 'none', color: theme.palette.primary.main }}
            >
              Didn't receive code? Resend
            </Button>
          </>
        )}

        {/* Step 3: Reset Password */}
        {step === 'reset' && (
          <>
            <TextField
              label="New Password"
              type="password"
              placeholder="Enter new password"
              value={newPassword}
              onChange={(e) => onNewPasswordChange(e.target.value)}
              disabled={isSubmitting}
              fullWidth
              sx={{ mb: 2 }}
            />
            <TextField
              label="Confirm Password"
              type="password"
              placeholder="Confirm password"
              value={confirmPassword}
              onChange={(e) => onConfirmPasswordChange(e.target.value)}
              error={!!passwordError}
              helperText={passwordError}
              disabled={isSubmitting}
              fullWidth
              sx={{ mb: 3 }}
            />
            <Typography variant="caption" sx={{ mb: 3, display: 'block', color: theme.palette.text.secondary }}>
              Password must be at least 8 characters with uppercase, lowercase, number, and symbol
            </Typography>
            <Button
              variant="contained"
              color="primary"
              fullWidth
              disabled={isSubmitting || !newPassword || !confirmPassword}
              onClick={onSubmit}
              sx={{ height: 44 }}
            >
              {isSubmitting ? <CircularProgress size={24} /> : 'Reset Password'}
            </Button>
          </>
        )}
      </motion.div>
    </Box>
  )
}
