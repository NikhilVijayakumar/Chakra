# Prana PR: Virtual Drive Security Enforcement

**Status:** Proposal
**Owner repo:** Prana
**Requested by:** Chakra (Phase 10 — Drive Layout JSON, session 2)

---

## Problem

Three security enforcement gaps exist in the current virtual drive implementation:

### 1. Drive Stays Mounted After App Exits

The rclone process mounts the virtual drive. If the app exits abnormally (crash, force kill) or if `dispose()` does not wait for the rclone process to terminate, the mount point remains accessible to anyone with filesystem access. The drive should be locked (unmounted) whenever the app is not running.

### 2. failClosed Defaults to False

`failClosed` controls whether the app blocks startup or falls back to plaintext storage when the encrypted mount fails. It currently defaults to `false`, meaning a mount failure silently downgrades to an unencrypted local directory. In production, this is a security regression — sensitive data that should be encrypted is stored in plaintext without the user knowing.

### 3. Default/Weak cryptPassword Not Detected

The `cryptPassword` for the system drive falls back through `systemConfig.cryptPassword → runtimeConfig.systemCryptPassword → vaultArchivePassword`. If none of these are set, `vaultArchivePassword` defaults to `'default'` (a hardcoded placeholder). This means the crypt key is trivially guessable in any environment that hasn't explicitly configured a password.

---

## Proposal

### Fix 1 — Enforce Unmount on Process Exit

Ensure `driveControllerService.dispose()` waits for the rclone child process to fully exit (SIGTERM + timeout + SIGKILL fallback). Verify the `before-quit` hook in the client app correctly awaits `dispose()`.

Prana should expose a `getActiveChildren()` utility so the host app can register an explicit kill guard during `app.on('before-quit')`.

### Fix 2 — Default failClosed to True in Production

Change the default resolution of `failClosed`:

```typescript
// Before:
failClosed: runtimeConfig?.failClosed === true,

// After:
const isDev = process.env.NODE_ENV === 'development'
failClosed: runtimeConfig?.failClosed ?? !isDev,
```

When `failClosed` is `true` and the encrypted mount fails, Prana logs a blocking error and returns a `BLOCKED` status from `bootstrapHost` rather than silently falling back.

The client app may override with `failClosed: false` explicitly for dev/test environments.

### Fix 3 — Weak Password Warning

Before mounting the system drive, check whether the resolved `cryptPassword` is a known weak value:

```typescript
const WEAK_PASSWORDS = new Set(['default', 'password', '', 'changeme', 'prana'])

if (WEAK_PASSWORDS.has(password.toLowerCase())) {
  console.warn('[Prana] SECURITY WARNING: virtual drive crypt password is a weak/default value. Set CHAKRA_VAULT_ARCHIVE_PASSWORD or systemConfig.cryptPassword to a strong secret.')
}
```

This is non-blocking — dev environments commonly use placeholder passwords. The warning must be visible in the log at WARN level.

---

## Required Behavior

1. After `dispose()` completes, the rclone mount point is no longer accessible.
2. In production (`failClosed: true` default), if the encrypted mount fails, `bootstrapHost` returns `BLOCKED` — no silent plaintext fallback.
3. A weak/default `cryptPassword` produces a `[Prana] SECURITY WARNING` log line at mount time.
4. Existing behavior in dev mode (`NODE_ENV === 'development'` or explicit `failClosed: false`) is unchanged.

---

## Acceptance Criteria

- `dispose()` terminates the rclone process and verifies the mount point is no longer accessible.
- `failClosed` defaults to `true` in non-development environments.
- Weak password set produces a console.warn at mount time (non-blocking).
- No breaking change to `failClosed: false` explicit override for dev/test.

---

## Non-Goals

- Do not change the crypt algorithm or key derivation — this is existing rclone crypt behavior.
- Do not add per-user key management — the single `cryptPassword` model is sufficient.
- Do not add an explicit lock/unlock UI — the mount lifecycle is internal to Prana.

---

## Files Expected to Change in Prana

- `src/main/services/driveControllerService.ts` — `failClosed` default logic, weak-password check, dispose() kill verification
- `src/main/services/virtualDriveProvider.ts` — Ensure `unmount()` waits for process exit and confirms mount point inaccessible
