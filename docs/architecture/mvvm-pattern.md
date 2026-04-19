# Architecture: MVVM Pattern

Chakra follows **Astra's MVVM (Model-View-ViewModel)** pattern for all UI implementations.

## State Flow

```
INIT → LOADING → COMPLETED (or ERROR)
```

| State | Description | Code |
|-------|-------------|------|
| `INIT` | Initial state, no data loaded | `StateType.INIT = 0` |
| `LOADING` | Async operation in progress | `StateType.LOADING = 1` |
| `COMPLETED` | Operation succeeded with data | `StateType.COMPLETED = 2` |
| `ERROR` | Operation failed | `isError: true` |

## useDataState Pattern

Chakra uses the same `useDataState` hook from Astra for async data handling:

```typescript
import { useDataState, StateType, AppState } from 'astra';

// In any Chakra component:
const [appState, execute] = useDataState<App[]>();

// Execute async operation:
useEffect(() => {
  execute(() => AppRepo.getApps());
}, []);

// Render based on state:
if (appState.state === StateType.LOADING) return <Loading />;
if (appState.isError) return <Error message={appState.statusMessage} />;
return <AppList data={appState.data} />;
```

## AppState Interface

```typescript
interface AppState<T> {
  state: StateType;
  isError: boolean;
  isSuccess: boolean;
  status: HttpStatusCode;
  statusMessage: string;
  data: T | null;
}
```

## MVVM Structure in Chakra

Chakra follows this directory structure:

```
src/renderer/
├── main.tsx                      # React entry point
├── common/
│   └── components/             # UI components (from Astra)
├── features/
│   └── [feature-name]/
│       ├── components/        # Feature-specific components
│       │   ├── Container.tsx # MVVM Container (data fetching)
│       │   ├── ViewModel.ts # ViewModel (state logic)
│       │   └── View.tsx    # View (presentation)
│       ├── domain/          # Business logic
│       ├── repo/            # Repository/API calls
│       └── hooks/          # Custom hooks
```

## Container → ViewModel → View Pattern

### Container
```typescript
// src/renderer/features/[feature]/components/Container.tsx
import { ViewModel } from './ViewModel';
import { View } from './View';

export function AppListContainer() {
  const [appState, execute] = useDataState<App[]>();

  useEffect(() => {
    execute(() => AppRepo.getApps());
  }, []);

  return <ViewModel appState={appState} />;
}
```

### ViewModel
```typescript
// src/renderer/features/[feature]/components/ViewModel.tsx
import { AppState } from 'astra';

interface Props {
  appState: AppState<App[]>;
}

export function ViewModel({ appState }: Props) {
  return <View {...appState} />;
}
```

### View
```typescript
// src/renderer/features/[feature]/components/View.tsx
import { StateType } from 'astra';

interface Props extends AppState<App[]> {}

export function View({ state, data, isError, statusMessage }: Props) {
  if (state === StateType.LOADING) return <LoadingSpinner />;
  if (isError) return <ErrorMessage message={statusMessage} />;

  return (
    <ul>
      {data?.map(app => <AppCard key={app.id} app={app} />)}
    </ul>
  );
}
```

## Integration with Prana

Chakra combines Astra MVVM with Prana's IPC services:

```typescript
// Container uses Prana IPC:
import { ipcService } from 'prana';

const [appState, execute] = useDataState<App[]>();

execute(async () => {
  const response = await ipcService.invoke('app:list');
  return response;
});
```

## Rules

- **Always use useDataState** for async operations
- **Never use useState directly** for data (use useDataState)
- **Follow Container → ViewModel → View** structure
- **Never hardcode strings** — use localization
- **Never hardcode colors** — use theme tokens

## Related

- [State Management](state-management.md)
- [Theming](theming.md)
- [Repository](repository.md)
- [Localization](localization.md)