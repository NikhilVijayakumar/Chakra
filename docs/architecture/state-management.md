# Architecture: State Management

Chakra follows **Astra's centralized state management** using MVVM patterns.

## StateType Enum

Chakra uses the same `StateType` enum from Astra:

```typescript
// From astra/src/common/state/AppState.ts
enum StateType {
  INIT = 0,      // Initial state
  LOADING = 1,     // Loading in progress
  COMPLETED = 2,   // Completed successfully
}
```

## State Transitions

```
[INIT] --------→ [LOADING] --------→ [COMPLETED]
   ↑              ↓                    ↓
   ↑              ↓                isError = true
   ↑              ↓                isError = false
   ←───────────────                   [ERROR]
```

## AppState Interface

```typescript
interface AppState<T> {
  state: StateType;           // INIT | LOADING | COMPLETED
  isError: boolean;          // true if operation failed
  isSuccess: boolean;        // true if operation succeeded
  status: HttpStatusCode;    // HTTP status code
  statusMessage: string;     // User-facing message
  data: T | null;         // Response data (null if error)
}
```

## Using useDataState

### Basic Usage
```typescript
import { useDataState, StateType, AppState } from 'astra';

const [appState, execute] = useDataState<AppList>();

execute(async () => {
  // Returns ServerResponse<T>
  return await ipcService.invoke<AppList>('app:list');
});
```

### Conditional Rendering
```typescript
// Using AppStateHandler (from Astra)
import { AppStateHandler, StateType } from 'astra';

<AppStateHandler
  appState={appState}
  SuccessComponent={({ appState }) => <AppList data={appState.data} />}
  emptyCondition={(data) => data?.length === 0}
  loadingMessage="Loading apps..."
  errorMessage="Failed to load apps"
/>
```

### Manual State Handling
```typescript
const [appState, execute] = useDataState<AppList>();

if (appState.state === StateType.LOADING) {
  return <LinearProgress />;
}

if (appState.isError) {
  return <Alert severity="error">{appState.statusMessage}</Alert>;
}

if (!appState.data?.length) {
  return <EmptyState message="No apps installed" />;
}

return <AppGrid apps={appState.data} />;
```

## HttpStatusCode

Chakra uses Astra's HTTP status codes:

```typescript
enum HttpStatusCode {
  IDLE = 0,
  OK = 200,
  CREATED = 201,
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  INTERNAL_SERVER_ERROR = 500,
}
```

## State Persistence

### Volatile State (Session)
```typescript
// Stored in memory, cleared on refresh
// Used for: current view, temporary selections
const [selectedApp, setSelectedApp] = useState<App | null>(null);
```

### Persistent State (SQLite)
```typescript
// Stored in /mounted-drive/cache/chakra.sqlite
// Used for: user preferences, app registry, config
import { ipcService } from 'prana';

const saveConfig = async (config: AppConfig) => {
  await ipcService.invoke('config:set', config);
};
```

## Chakra State Structure

```
State
├── Volatile (React useState)
│   ├── currentScreen
│   ├── selectedApp
│   └── dialogOpen
└── Persistent (SQLite via Prana)
    ├── userSession
    ├── appRegistry
    └── config
```

## Rules

- **Always use useDataState** for async API calls
- **Use useState** only for UI state (selections, dialogs)
- **Never store sensitive data** in volatile state
- **Use Prana IPC** for persistent storage

## Related

- [MVVM Pattern](mvvm-pattern.md)
- [Theming](theming.md)
- [Repository](repository.md)