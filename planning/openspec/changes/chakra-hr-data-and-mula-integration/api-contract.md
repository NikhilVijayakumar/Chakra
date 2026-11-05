# Interface and Data Contract: chakra-hr-data-and-mula-integration

Extends `chakra-shared-library/api-contract.md`. Unchanged: invocation (`<cli> <group> <command>`, JSON on stdin, one envelope on stdout), the envelope, and all existing operations. Changes: `apiVersion` is **2**, new operations, new error codes, extended `sync run`/`sync status`/`content get`.

Knowledge: [CLI contract](../../../../backend/knowledge/concepts/cli-contract.md), [library surface](../../../../frontend/knowledge/concepts/library-surface.md).

## Operations

All new write operations require `appId` (set by the library main process, never the renderer) and an app marked enabled in the sheet (`specs/app-features`).

| Command | Request | Response data |
|---|---|---|
| `content create` | `{ appId, content, record }` | `{ row }` |
| `content update` | `{ appId, content, id, record }` | `{ row }` |
| `content delete` | `{ appId, content, id }` | `{ deleted: true }` |
| `content get` (extended) | `{ appId, content, where?, includeDeleted? }` | `{ rows }` (deleted rows only if `includeDeleted`; never returns `password_hash`) |
| `sync run` (extended) | `{ target?: "all"\|<content-id> }` | `{ results: [{ target, rows, ok, pushed, message? }], pushed, pendingLeft, quarantined }` |
| `sync status` (extended) | `{ }` | existing fields plus `contents[].dirty`, `quarantined` (pending entries) |
| `quarantine list` | `{ appId, status? }` | `{ entries: [Entry] }` newest first, default status `pending` |
| `quarantine count` | `{ appId }` | `{ count }` |
| `quarantine reject` | `{ appId, id }` | `{ updated: true }` |
| `quarantine accept-sheets` | `{ appId, id }` | `{ updated: true }` |
| `quarantine apply-local` | `{ appId, id }` | `{ updated: true }` (conflicts only) |
| `quarantine fix` | `{ appId, id, record }` | `{ row }` |
| `quarantine delete-record` | `{ appId, id }` | `{ updated: true }` (marks `rejected`, as Mula does) |
| `quarantine scan` | `{ appId }` | `{ newIssues }` |

`Entry` = `{ id, content, recordId, reason, details, sheetsData, localData, status, createdAt }` where `reason` is `missing_id | missing_required | invalid_relation | type_mismatch | conflict` and `status` is `pending | resolved | rejected`. `id` is generated (`QRN` + timestamp + random).

### Field rules
- `record` is an object of content column names. `id`, `sync`, `is_dirty`, `is_deleted` are controlled by the CLI and ignored if supplied (except `fix`, which may supply an `id`).
- `employees` accept an optional `password`; it is hashed with bcrypt and never returned. A new employee without it gets the default initial password (a registry/config value, bcrypt-hashed). `password_hash` is never accepted from the caller.
- Ids are generated as `<prefix><zero-padded max+1>` over existing ids (including deleted rows), width 3, prefixes from the registry (`DEPT`, `DES`, `TEAM`, `EMP`, `EMT`, `ATT`, `HOL`, `LEA`, `CFG`).
- Integer columns (`leaves.count`, `carry_forward`, `max_forward`) must be integers or `validation_failed`.

### Registry additions (per content, data file)
`writable`, `id_prefix`, `required: [column]`, `relations: [{ column, content }]`, `integers: [column]` (only `count` and `max_forward`; `carry_forward` is text `TRUE`/`FALSE` in the sheet), `sync_column` (default `sync`), `quarantine_name`. Tab names are data; unchanged tabs keep their current values.

## Error codes (additions)

`validation_failed` (message names the field, never a secret), `not_found`, `content_read_only`, `quarantine_unknown`. Existing codes unchanged. `invalid_request` is also used for `apply-local` on a non-conflict.

## Library surface (Electron)

New whitelisted ops in `OPS`: `content.create`, `content.update`, `content.delete`, `quarantine.list`, `quarantine.count`, `quarantine.reject`, `quarantine.acceptSheets`, `quarantine.applyLocal`, `quarantine.fix`, `quarantine.deleteRecord`, `quarantine.scan`. All are app-scoped (`appId` injected in main). `sync.run` and `quarantine.scan` use the long timeout. Preload exposes them under `window.chakra.content.*` and `window.chakra.quarantine.*`; renderer exports typed `chakraCall` helpers and hooks (`useContent`, `useContentMutations`, `useQuarantine`).

`SUPPORTED_API_VERSION` becomes 2.

## Data and trust boundaries

- The CLI owns SQLite, the sheet writes and password hashing. Mula holds no credentials after the migration.
- Cache tables gain `sync` (integer epoch seconds, nullable), `is_dirty`, `is_deleted`; a `quarantine` table is added. The cache carries a schema version; an older cache is rebuilt (unpushed edits in an old cache are lost; password updates pending in the old `pending_updates` table are carried over by marking the employee row dirty before the rebuild when possible, otherwise lost and reported).
- `content get` never returns `password_hash` or OTP data; the renderer receives only sanitized envelopes.
- Sheet writes go by header name (column positions looked up in the header row), not fixed letters, so column reordering does not corrupt data. Writes use `valueInputOption=RAW`.
- Input from the renderer is untrusted: content ids are checked against the registry; column names against the content's columns; values are bound as SQL parameters; sheet values are written as strings.
- The CLI path remains user-configured, validated as an executable file, run without a shell.

## Compatibility and migration

- Existing consumers (0.2.0) calling a 2.x CLI get `cli_incompatible` from the library (equality check). Upgrade library and CLI together.
- Contract tests cover every new operation, each error code, and the unchanged operations.

## Open questions
- [ ] Default initial password: keep Mula's `change@123` as a CLI setting default, or force a reset flow instead?
- [ ] `content get` for `employees`: confirm returning all columns except `password_hash` is acceptable to Mula's UI.
