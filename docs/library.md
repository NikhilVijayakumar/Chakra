# Chakra as a library

Chakra is a reusable base for desktop apps. An app gets **splash, authentication and a CLI-location screen** from **Chakra UI** (this repo's `frontend/`, an npm package) and never touches the database, Google Sheets, credentials or email: all of that lives in the **Chakra CLI** (`backend/`, Python).

```
your app (Electron) ──► Chakra UI ──► chakra CLI ──► SQLite cache ◄── Google Sheets
   renderer: <ChakraGate>      spawn per call, JSON on stdin/stdout
   main:     registerChakra({ appId })
   preload:  exposeChakra()
```

## Use it in an app

```ts
// main
import { registerChakra } from '@nikhilvijayakumar/chakra-ui/main'
registerChakra({ appId: 'my-app', defaultCliPath: '/path/to/bundled/chakra' })

// preload
import { exposeChakra } from '@nikhilvijayakumar/chakra-ui/preload'
exposeChakra()

// renderer (inside your MUI ThemeProvider)
import { ChakraGate } from '@nikhilvijayakumar/chakra-ui'
<ChakraGate>{({ user, app, logout }) => <MyApp user={user} features={app.features} />}</ChakraGate>
```

`ChakraGate` runs: splash -> locate CLI -> CLI health (`meta doctor`) -> synced content (offers manual sync) -> app enabled (from the sheet) -> login -> your app. The host may supply `defaultCliPath` to use a verified bundled executable on first run; a saved selection takes precedence. If neither works, the CLI configuration screen (`CliConfigScreen`, also exported for settings) offers selection and verification.

After valid credentials, Chakra checks direct or team-based membership in the registered app. A denied user sees the shared no-access screen. Previously synchronized permissions remain usable after a later refresh failure; never-synchronized membership data is rejected. This is an app-level gate, not protection from an OS user who can invoke the CLI directly.

Apps read data through `chakraCall('content.get', { content })`; the CLI returns only content permitted by the features the sheet grants that `appId`. See `frontend/src/library/renderer/` for `SyncPanel` (sync status and manual sync).

## Extend or replace the defaults

- **Boot checks "CLI connected":** the gate calls `window.chakra.cli.status()` (saved path -> starts, supported API version, health checks). Not configured or unreachable sends the user to the CLI configuration screen; failing health checks stay on the boot screen with Retry / Configure CLI.
- **Replace any screen:** `<ChakraGate screens={{ splash, boot, cliConfig, syncPrompt, login, forgot }}>`. Each receives the callbacks it needs (`onLogin`, `onSaved`, `retry`, ...).
- **Add your own boot checks:** `<ChakraGate extraStages={[{ id: 'license', label: 'License', run: async ({ app }) => (ok ? null : 'License expired') }]}>`; they run after the built-in ones and block login when they return a message.
- **Build screens from scratch:** headless hooks `useCliConnection(pollMs)`, `useCliConfig`, `useLogin`, `useForgotPassword`, `useSync`; the default screens are thin views over them. `CliStatusBadge` is a ready connected/disconnected chip for headers or settings pages, and `CliConfigScreen` can be embedded in your own settings page.

`src/main`, `src/preload`, `src/renderer` in `frontend/` are a runnable reference consumer: `npm run dev`.

## CLI

```
backend/.venv/bin/python -m chakra_backend <group> <command>   # dev
python backend/build_cli.py                                       # standalone build (run per OS; Windows is primary)
```

Configure it once with `chakra config set` (JSON on stdin): `spreadsheet_id`, `service_account_path`, `agentmail_api_key`, `agentmail_inbox_id`. The data directory is `%APPDATA%\chakra` on Windows, `$XDG_DATA_HOME/chakra` on Linux (override with `CHAKRA_HOME`).

Sheets are the source of content; SQLite is a cache that also holds edits not yet pushed (deleting it loses those edits only). A sheet layout change is a change to `backend/src/chakra_backend/contents.json` only (currently provisional).

## Reading and writing content

An app has no database. It reads and writes through the library, and the CLI keeps the cache and the sheet in step. An app may read and write only if the sheet marks it enabled.

```tsx
const { rows, reload } = useContent('departments')                 // live rows
const { create, update, remove } = useContentMutations('departments', reload)
await create({ name: 'Ops', status: 'active' })                    // { ok, error, row }
```

Edits are stored locally and pushed to the sheet at the next sync (`useSync().run()`). A sync also pulls the sheet: the row with the newer `sync` stamp wins, a row changed on both sides is kept as a `conflict`, and rows that fail validation (missing id or required field, unknown relation, non-integer number) are held in quarantine instead of being loaded. Resolve them with `useQuarantine()` (`reject`, `acceptSheets`, `applyLocal`, `fix`, `deleteRecord`, `scan`) and show a badge with `useQuarantineCount()`. Passwords are sent as plain input and stored only as bcrypt hashes; they are never returned.

Writable contents, ids and required fields are data in `contents.json`. Set `default_password` with `chakra config set` if new employees may be created without a password.

The app-aware login contract uses CLI `apiVersion` 3. Chakra UI 0.4.0 and CLI 0.4.0 must be upgraded together; API version 2 CLIs are reported as incompatible.
