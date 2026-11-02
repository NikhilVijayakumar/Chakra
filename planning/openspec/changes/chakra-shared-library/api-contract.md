# Interface and Data Contract: chakra-shared-library

Interface: Electron main (client) <-> `chakra` CLI (server), one process per call, JSON over stdio.

## Invocation

`<cli> <group> <command> [flags]`, request body as a single JSON object on **stdin**, response a single JSON object on **stdout**, diagnostics on stderr. Exit code 0 on `ok: true`, non-zero otherwise. Sensitive fields (password, otp) are only ever sent on stdin.

Envelope:
```json
{ "ok": true,  "data": { }, "apiVersion": 1 }
{ "ok": false, "error": { "code": "invalid_credentials", "message": "…" }, "apiVersion": 1 }
```

## Operations

| Command | Request | Response data |
|---|---|---|
| `meta version` | none | `{ version, apiVersion }` |
| `meta doctor` | none | `{ checks: [{ id, ok, message }] }` — ids: `sqlite`, `google_credentials`, `email`, `sheet_config` |
| `auth login` | `{ email, password }` | `{ user: { id, email, name, role? } }` |
| `auth validate-email` | `{ email }` | `{ exists }` |
| `auth otp-send` | `{ email }` | `{ sent, expiresInSeconds }` |
| `auth otp-verify` | `{ email, otp }` | `{ resetToken }` |
| `auth reset-password` | `{ email, resetToken, newPassword }` | `{ updated }` |
| `sync run` | `{ target?: "all"\|<content-id> }` | `{ results: [{ target, rows, ok, message? }], pushed, pendingLeft }` |
| `sync status` | `{ }` | `{ synced: bool, lastSyncAt, contents: [{ id, synced, rowCount, lastSyncAt, error? }], pending }` |
| `app info` | `{ appId }` | `{ appId, enabled, features: [featureId] }` |
| `app can` | `{ appId, feature }` | `{ allowed }` |
| `content get` | `{ appId, content, where? }` | `{ rows }` |
| `config get` / `config set` | `{ key }` / `{ key, value }` | `{ value }` / `{ updated }` |

`content get` returns only content the app's granted features allow (`feature_denied` otherwise). `sync status` is computed from cache metadata and never calls Google. Content ids are those in the CLI's content registry (see design).

## Error codes

`invalid_request`, `invalid_credentials`, `unknown_email`, `otp_invalid`, `otp_expired`, `reset_token_invalid`, `unknown_content`, `feature_denied`, `app_not_enabled`, `not_synced`, `sheets_unavailable`, `email_unavailable`, `config_missing`, `internal`. Messages never contain passwords, OTPs, tokens or credentials.

## Library surface (Electron)

- Main: `registerChakra({ app, appId, window })` registers IPC `chakra:*` channels; `appId` identifies the consuming app to the CLI.
- Preload: `window.chakra` with `cli.getConfig/setPath/verify`, `auth.*`, `sync.run/status`, `app.info/can`, `content.get`.
- Renderer: components `ChakraSplash`, `ChakraBoot`, `ChakraLogin`, `ChakraForgotPassword`, `ChakraCliConfig`, `ChakraProvider`, and a route helper.
- Renderer receives only the sanitized `{ ok, data|error }` envelope; the CLI path is only exposed to the config screen.

## Data and trust boundaries

- Backend owns the SQLite file and all credentials (Google service account, email provider key, password hashes). Electron stores only the CLI path (and a last-verified result) in its own settings file.
- The CLI path is user-provided, so it is validated as an existing regular executable file and is run without a shell. Argument values never come from the renderer except fixed command names.
- Responses are untrusted input to the renderer and validated against the contract shape.

## Open questions
- [ ] Content registry: ids and the sheet each maps to; feature-to-content mapping.
- [ ] Session lifetime/token handling after `auth login` (currently renderer-held; see design).
