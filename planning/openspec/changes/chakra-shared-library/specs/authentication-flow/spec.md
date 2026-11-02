# Capability: authentication-flow

## ADDED Requirements

### Requirement: Login via CLI
The library SHALL authenticate users only by calling `auth login`; the renderer and Electron main SHALL NOT hash, compare or store passwords.

#### Scenario: Successful login
- **GIVEN** a healthy verified CLI and valid credentials
- **WHEN** the user submits the login form
- **THEN** the user is routed to the consumer's home route

#### Scenario: Invalid credentials
- **WHEN** the CLI returns `invalid_credentials`
- **THEN** the form shows a generic failure message and no session is created

### Requirement: Forgot and reset password
The library SHALL provide forgot-password with OTP using `auth validate-email`, `auth otp-send`, `auth otp-verify` and `auth reset-password`.

#### Scenario: Full reset
- **GIVEN** a registered email
- **WHEN** the user requests an OTP, enters the correct OTP and a new password
- **THEN** the password is updated and the user returns to login

#### Scenario: Wrong or expired OTP
- **WHEN** the CLI returns `otp_invalid` or `otp_expired`
- **THEN** the user sees the matching message and may retry or request a new OTP

### Requirement: Secrets stay out of logs and arguments
Passwords and OTPs SHALL be passed to the CLI only on stdin and SHALL NOT appear in logs or error messages.

#### Scenario: Failed call
- **WHEN** a CLI call fails
- **THEN** the logged and displayed error contains no password, OTP or token
