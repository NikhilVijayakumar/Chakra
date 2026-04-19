# Auth Override - Login Fix

## Problem

When logging in with correct credentials, the app would refresh instead of navigating to the dashboard or onboarding page. 
Login with wrong credentials worked correctly (showed error).

## Root Cause

Prana's `LoginContainer` was not properly handling the successful login response, or was triggering a window reload instead of using React Router navigation.

## Solution

Created a custom `LoginContainerOverride` that:

1. **Intercepts the login flow** - Calls the auth IPC handler directly
2. **Handles the response properly** - Checks `success` flag and navigates accordingly
3. **Stores the session** - Uses `volatileSessionStore.setSession()` with proper token expiry
4. **Navigates with React Router** - Uses `navigate()` instead of `window.location.reload()`
5. **Logs all transitions** - Console logs for debugging

## Files Changed

- `src/renderer/src/features/auth-override/view/LoginContainerOverride.tsx` - Custom login container
- `src/renderer/src/main.tsx` - Updated to use `LoginContainerOverride` instead of Prana's `LoginContainer`

## Testing

Test with:
1. **Correct credentials** → Should navigate to `/dashboard` or `/onboarding` without refresh
2. **Wrong credentials** → Should show error message and stay on login page
3. **Check browser console** → Look for `[LoginOverride]` logs to track the flow

## Implementation Details

The component:
- Takes email and password from `LoginView` props
- Invokes `window.api.auth.login(email, password)` via IPC
- On success: Sets session with 1-hour TTL and navigates
- On failure: Shows error message and keeps user on login page
- Uses `setTimeout` to ensure state is settled before navigation
