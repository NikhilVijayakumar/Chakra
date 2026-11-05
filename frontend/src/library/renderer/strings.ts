export const defaultStrings = {
  brandName: 'Chakra',
  tagline: 'Initializing secure workspace',
  bootTitle: 'Starting up',
  stageCli: 'Locating Chakra CLI',
  stageHealth: 'Checking CLI health',
  stageSync: 'Checking synced content',
  stageApp: 'Checking app access',
  cliConfigTitle: 'Chakra CLI',
  cliPathLabel: 'Path to the Chakra CLI executable',
  verify: 'Verify',
  save: 'Save',
  syncNow: 'Sync now',
  syncing: 'Syncing…',
  retry: 'Retry',
  configureCli: 'Configure CLI',
  loginTitle: 'Sign in',
  email: 'Email',
  password: 'Password',
  signIn: 'Sign in',
  forgot: 'Forgot password?',
  back: 'Back',
  sendOtp: 'Send code',
  otp: 'Code',
  verifyOtp: 'Verify code',
  newPassword: 'New password',
  resetPassword: 'Reset password',
  resetDone: 'Password updated. You can sign in now.',
  locked: 'Too many failed attempts. Try again in {s} seconds.',
  invalidCredentials: 'Invalid email or password.'
}
export type Strings = typeof defaultStrings

/** Error code -> message. Anything unknown falls back to the generic text, never the raw CLI message. */
export const errorMessages: Record<string, string> = {
  invalid_credentials: 'Invalid email or password.',
  unknown_email: 'No active account for this email.',
  otp_invalid: 'That code is not correct.',
  otp_expired: 'That code has expired. Request a new one.',
  reset_token_invalid: 'The reset session expired. Start again.',
  email_unavailable: 'The email service is unavailable.',
  sheets_unavailable: 'Google Sheets is unavailable.',
  config_missing: 'The CLI is not fully configured.',
  not_synced: 'Content has not been synced yet.',
  app_not_enabled: 'This app is not enabled for your organization.',
  feature_denied: 'This app may not use that feature.',
  cli_unavailable: 'The CLI cannot be started. Check its location.',
  cli_timeout: 'The CLI did not respond in time.',
  cli_incompatible: 'This CLI version is not compatible.',
  invalid_request: 'Please check the values and try again.'
}
export const messageFor = (code: string): string => errorMessages[code] ?? 'Something went wrong. Please try again.'
