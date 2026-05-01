import { FC, useState } from 'react'
import { Box, Button, TextField, Typography, CircularProgress, Alert, useTheme, useMediaQuery } from '@mui/material'
import { motion } from 'framer-motion'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'

interface EnhancedLoginViewProps {
  isSubmitting: boolean
  error: string | null
  email: string
  password: string
  isLocked: boolean
  lockRemainingSeconds: number
  attemptsRemaining: number
  onEmailChange: (email: string) => void
  onPasswordChange: (password: string) => void
  onSubmit: () => void
  onBack: () => void
  onForgotPassword: () => void
}

/**
 * EnhancedLoginView
 * 
 * Login screen with:
 * - 3-attempt lockout (30 second)
 * - Email & password validation
 * - Brand messaging
 * - Dark/light theme support
 * - Mobile responsive
 */
export const EnhancedLoginView: FC<EnhancedLoginViewProps> = ({
  isSubmitting,
  error,
  email,
  password,
  isLocked,
  lockRemainingSeconds,
  attemptsRemaining,
  onEmailChange,
  onPasswordChange,
  onSubmit,
  onBack,
  onForgotPassword
}) => {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  const [emailError, setEmailError] = useState('')
  const [passwordError, setPasswordError] = useState('')

  const validateEmail = (value: string) => {
    if (!value) {
      setEmailError('Email is required')
      return false
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(value)) {
      setEmailError('Please enter a valid email address')
      return false
    }
    setEmailError('')
    return true
  }

  const validatePassword = (value: string) => {
    if (!value) {
      setPasswordError('Password is required')
      return false
    }
    // At least 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 symbol
    const pwRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/
    if (!pwRegex.test(value)) {
      setPasswordError(
        'Password must be at least 8 characters with uppercase, lowercase, number, and symbol'
      )
      return false
    }
    setPasswordError('')
    return true
  }

  const handleSubmit = () => {
    if (!validateEmail(email)) return
    if (!validatePassword(password)) return
    onSubmit()
  }

  return (
    <Box
      sx={{
        display: 'flex',
        width: '100%',
        minHeight: '100vh',
        bgcolor: theme.palette.background.default
      }}
    >
      {/* Left Panel - Brand Message */}
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
                mb: 2,
                display: 'flex',
                alignItems: 'center',
                gap: 1
              }}
            >
              BAVANS · Chakra
            </Typography>
            <Typography
              variant="h3"
              sx={{
                fontWeight: 700,
                letterSpacing: '-0.03em',
                mb: 3,
                lineHeight: 1.1
              }}
            >
              Secure access to your application platform
            </Typography>
            <Typography
              sx={{
                fontSize: '1rem',
                lineHeight: 1.6,
                color: theme.palette.text.secondary,
                maxWidth: 400
              }}
            >
              Chakra provides unified authentication for all BAVANS applications. Sign in to access
              your installed apps and manage your platform.
            </Typography>
          </Box>
        </motion.div>
      )}

      {/* Right Panel - Login Form */}
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
          Back to Splash
        </Button>

        <Typography variant="h5" sx={{ fontWeight: 600, mb: 1 }}>
          Sign in
        </Typography>
        <Typography variant="body2" sx={{ color: theme.palette.text.secondary, mb: 4 }}>
          Enter your credentials to continue
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {isLocked && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            Too many failed attempts. Please try again in {lockRemainingSeconds} seconds.
          </Alert>
        )}

        <TextField
          label="Email"
          type="email"
          placeholder="you@company.com"
          value={email}
          onChange={(e) => {
            onEmailChange(e.target.value)
            setEmailError('')
          }}
          onBlur={() => validateEmail(email)}
          error={!!emailError}
          helperText={emailError}
          disabled={isSubmitting || isLocked}
          fullWidth
          sx={{ mb: 3 }}
        />

        <TextField
          label="Password"
          type="password"
          placeholder="Enter password"
          value={password}
          onChange={(e) => {
            onPasswordChange(e.target.value)
            setPasswordError('')
          }}
          onBlur={() => validatePassword(password)}
          error={!!passwordError}
          helperText={passwordError}
          disabled={isSubmitting || isLocked}
          fullWidth
          sx={{ mb: 2 }}
        />

        {attemptsRemaining > 0 && !isLocked && (
          <Typography
            variant="caption"
            sx={{
              color: theme.palette.warning.main,
              mb: 2,
              display: 'block'
            }}
          >
            {attemptsRemaining} attempt(s) remaining before lockout
          </Typography>
        )}

        <Button
          variant="contained"
          color="primary"
          fullWidth
          disabled={isSubmitting || isLocked}
          onClick={handleSubmit}
          sx={{ height: 44, mb: 2 }}
        >
          {isSubmitting ? <CircularProgress size={24} /> : 'Sign In'}
        </Button>

        <Button
          variant="text"
          fullWidth
          onClick={onForgotPassword}
          disabled={isLocked}
          sx={{ mb: 4, textTransform: 'none', color: theme.palette.primary.main }}
        >
          Forgot password?
        </Button>

        {/* Demo credentials - only in dev/staging */}
        {process.env.NODE_ENV !== 'production' && (
          <Box
            sx={{
              p: 2,
              borderRadius: 1,
              bgcolor: theme.palette.action.hover,
              border: `1px solid ${theme.palette.divider}`,
              fontSize: '0.75rem'
            }}
          >
            <Typography variant="caption" sx={{ fontWeight: 600, display: 'block' }}>
              Demo Credentials:
            </Typography>
            <Typography variant="caption" sx={{ display: 'block', mt: 0.5 }}>
              Email: admin@bavans.com
            </Typography>
            <Typography variant="caption" sx={{ display: 'block' }}>
              Password: Password123!
            </Typography>
            <Typography variant="caption" sx={{ fontStyle: 'italic', display: 'block', mt: 0.5 }}>
              Will lock out for 30s after 3 failed attempts.
            </Typography>
          </Box>
        )}
      </motion.div>
    </Box>
  )
}
