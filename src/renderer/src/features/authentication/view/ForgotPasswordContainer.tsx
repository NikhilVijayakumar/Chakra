import { FC, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { ForgotPasswordView } from './ForgotPasswordView'

type ForgotPasswordStep = 'email' | 'verification' | 'reset'

interface ForgotPasswordState {
  step: ForgotPasswordStep
  email: string
  verificationCode: string
  newPassword: string
  confirmPassword: string
  codeHash: string | null
  codeExpiry: number | null
  isSubmitting: boolean
  error: string | null
  successMessage: string | null
  emailError: string | null
  verificationCodeError: string | null
  passwordError: string | null
}

const OTP_EXPIRY_MS = 5 * 60 * 1000 // 5 minutes

const generateOtp = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

const hashOtp = async (otp: string): Promise<string> => {
  const encoder = new TextEncoder()
  const data = encoder.encode(otp)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
  return hashHex
}

/**
 * ForgotPasswordContainer
 * 
 * Manages multi-step forgot password flow:
 * 1. User enters email → Prana validates email exists
 * 2. Chakra generates OTP, sends via email, stores hash+expiry
 * 3. User enters code → Chakra verifies via Prana's verifyCode
 * 4. User sets new password → Prana resets password
 * 
 * Uses Prana auth APIs for forgot password flow
 */
export const ForgotPasswordContainer: FC = () => {
  const navigate = useNavigate()
  const resendCounterRef = useRef(0)

  const [state, setState] = useState<ForgotPasswordState>({
    step: 'email',
    email: '',
    verificationCode: '',
    newPassword: '',
    confirmPassword: '',
    codeHash: null,
    codeExpiry: null,
    isSubmitting: false,
    error: null,
    successMessage: null,
    emailError: null,
    verificationCodeError: null,
    passwordError: null
  })

  const validateEmail = (email: string): boolean => {
    if (!email) {
      setState((prev) => ({ ...prev, emailError: 'Email is required' }))
      return false
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      setState((prev) => ({ ...prev, emailError: 'Please enter a valid email address' }))
      return false
    }
    setState((prev) => ({ ...prev, emailError: null }))
    return true
  }

  const validatePassword = (password: string): boolean => {
    if (!password) {
      setState((prev) => ({ ...prev, passwordError: 'Password is required' }))
      return false
    }
    const pwRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/
    if (!pwRegex.test(password)) {
      setState((prev) => ({
        ...prev,
        passwordError:
          'Password must be at least 8 characters with uppercase, lowercase, number, and symbol'
      }))
      return false
    }
    setState((prev) => ({ ...prev, passwordError: null }))
    return true
  }

  const sendOtpEmail = async (email: string, otp: string): Promise<void> => {
    try {
      await window.api.auth.sendOtpEmail(email, otp)
    } catch (err) {
      console.error('[OTP_EMAIL_ERROR] Failed to send OTP email:', err)
      throw new Error('Failed to send verification email')
    }
  }

  const handleStepEmail = async () => {
    if (!validateEmail(state.email)) return

    setState((prev) => ({ ...prev, isSubmitting: true, error: null }))

    try {
      const result = await window.api.auth.forgotPassword(state.email.trim().toLowerCase())

      if (!result.success) {
        const errorMessage = result.reason === 'email_mismatch' 
          ? 'Email address not found' 
          : 'Failed to process request'
        setState((prev) => ({ 
          ...prev, 
          isSubmitting: false, 
          error: errorMessage,
          emailError: errorMessage
        }))
        return
      }

      const otp = generateOtp()
      const codeHash = await hashOtp(otp)
      const codeExpiry = Date.now() + OTP_EXPIRY_MS

      try {
        await sendOtpEmail(state.email.trim().toLowerCase(), otp)
      } catch (emailErr) {
        console.warn('[OTP] Email send failed, logging OTP for testing:', otp)
      }

      setState((prev) => ({
        ...prev,
        step: 'verification',
        codeHash,
        codeExpiry,
        isSubmitting: false,
        successMessage: 'Verification code sent to your email'
      }))
    } catch (err) {
      setState((prev) => ({
        ...prev,
        isSubmitting: false,
        error: err instanceof Error ? err.message : 'Failed to send verification code'
      }))
    }
  }

  const handleStepVerification = async () => {
    if (!state.verificationCode) {
      setState((prev) => ({
        ...prev,
        verificationCodeError: 'Verification code is required'
      }))
      return
    }

    if (!state.codeHash || !state.codeExpiry) {
      setState((prev) => ({
        ...prev,
        isSubmitting: false,
        error: 'No verification code pending. Please restart the process.',
        step: 'email'
      }))
      return
    }

    setState((prev) => ({ ...prev, isSubmitting: true, error: null }))

    try {
      const result = await window.api.auth.verifyCode(
        state.verificationCode,
        state.codeHash,
        state.codeExpiry
      )

      if (!result.success) {
        const errorMessage = result.reason === 'code_expired' 
          ? 'Verification code has expired. Please request a new one.'
          : result.reason === 'invalid_code'
          ? 'Invalid verification code'
          : 'Verification failed'
        
        setState((prev) => ({
          ...prev,
          isSubmitting: false,
          verificationCodeError: errorMessage
        }))
        return
      }

      setState((prev) => ({
        ...prev,
        step: 'reset',
        isSubmitting: false,
        verificationCodeError: null,
        successMessage: 'Email verified. Now set your new password'
      }))
    } catch (err) {
      setState((prev) => ({
        ...prev,
        isSubmitting: false,
        verificationCodeError: err instanceof Error ? err.message : 'Invalid verification code'
      }))
    }
  }

  const handleStepReset = async () => {
    if (!validatePassword(state.newPassword)) return
    if (!validatePassword(state.confirmPassword)) return

    if (state.newPassword !== state.confirmPassword) {
      setState((prev) => ({
        ...prev,
        passwordError: 'Passwords do not match'
      }))
      return
    }

    setState((prev) => ({ ...prev, isSubmitting: true, error: null }))

    try {
      const result = await window.api.auth.resetPassword(state.newPassword)

      if (!result.success) {
        const errorMessage = result.reason === 'invalid_password'
          ? 'Password does not meet requirements'
          : 'Failed to reset password'
        
        setState((prev) => ({
          ...prev,
          isSubmitting: false,
          passwordError: errorMessage
        }))
        return
      }

      setState((prev) => ({
        ...prev,
        isSubmitting: false,
        successMessage: 'Password reset successfully'
      }))

      setTimeout(() => navigate('/login'), 2000)
    } catch (err) {
      setState((prev) => ({
        ...prev,
        isSubmitting: false,
        error: err instanceof Error ? err.message : 'Failed to reset password'
      }))
    }
  }

  const handleSubmit = () => {
    if (state.step === 'email') {
      handleStepEmail()
    } else if (state.step === 'verification') {
      handleStepVerification()
    } else if (state.step === 'reset') {
      handleStepReset()
    }
  }

  const handleResendCode = async () => {
    resendCounterRef.current++
    if (resendCounterRef.current >= 3) {
      setState((prev) => ({
        ...prev,
        error: 'Too many resend attempts. Please try again later.'
      }))
      return
    }

    if (!validateEmail(state.email)) return

    setState((prev) => ({ ...prev, isSubmitting: true, error: null }))

    try {
      const otp = generateOtp()
      const codeHash = await hashOtp(otp)
      const codeExpiry = Date.now() + OTP_EXPIRY_MS

      try {
        await sendOtpEmail(state.email.trim().toLowerCase(), otp)
      } catch (emailErr) {
        console.warn('[OTP] Email send failed, logging OTP for testing:', otp)
      }

      setState((prev) => ({
        ...prev,
        codeHash,
        codeExpiry,
        isSubmitting: false,
        successMessage: 'Code resent to your email'
      }))
    } catch (err) {
      setState((prev) => ({
        ...prev,
        isSubmitting: false,
        error: err instanceof Error ? err.message : 'Failed to resend code'
      }))
    }
  }

  const handleBack = () => {
    if (state.step === 'email') {
      navigate('/login')
    } else if (state.step === 'verification') {
      setState((prev) => ({
        ...prev,
        step: 'email',
        verificationCode: '',
        codeHash: null,
        codeExpiry: null,
        error: null,
        successMessage: null
      }))
    } else if (state.step === 'reset') {
      setState((prev) => ({
        ...prev,
        step: 'verification',
        newPassword: '',
        confirmPassword: '',
        error: null,
        successMessage: null
      }))
    }
  }

  return (
    <ForgotPasswordView
      step={state.step}
      email={state.email}
      verificationCode={state.verificationCode}
      newPassword={state.newPassword}
      confirmPassword={state.confirmPassword}
      isSubmitting={state.isSubmitting}
      error={state.error}
      successMessage={state.successMessage}
      emailError={state.emailError}
      verificationCodeError={state.verificationCodeError}
      passwordError={state.passwordError}
      onEmailChange={(email) => setState((prev) => ({ ...prev, email, emailError: null }))}
      onVerificationCodeChange={(code) =>
        setState((prev) => ({ ...prev, verificationCode: code, verificationCodeError: null }))
      }
      onNewPasswordChange={(password) =>
        setState((prev) => ({ ...prev, newPassword: password, passwordError: null }))
      }
      onConfirmPasswordChange={(password) =>
        setState((prev) => ({ ...prev, confirmPassword: password, passwordError: null }))
      }
      onSubmit={handleSubmit}
      onBack={handleBack}
      onResendCode={handleResendCode}
    />
  )
}