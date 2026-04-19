# Architecture: Repository Pattern

Chakra follows **Astra's Repository pattern** for API and data access.

## Repository Structure

```
Repository Pattern
├── ApiService        # HTTP client wrapper
├── ServerResponse  # Response wrapper
├── HttpStatusCode # Status enum
└── Repository   # Feature-specific repos
```

## ApiService Setup

Chakra uses `ApiService` from Astra:

```typescript
import { ApiService, ServerResponse, HttpStatusCode } from 'astra';

// For external APIs (e.g., Google Sheets)
const googleSheetsApi = new ApiService('https://sheets.googleapis.com/v4', {
  internal_server_error: 'Failed to fetch from Google Sheets.',
  unauthorized: 'Please sign in to Google.',
});
```

## ServerResponse Pattern

All API calls return `ServerResponse<T>`:

```typescript
interface ServerResponse<T> {
  isError: boolean;
  isSuccess: boolean;
  status: HttpStatusCode;
  statusMessage: string;
  data: T | null;
}

// Success:
ServerResponse.success({ status: 200, statusMessage: 'OK', data: apps });

// Error:
ServerResponse.error({ status: 500, statusMessage: 'Failed to load apps' });
```

## Repository Pattern in Chakra

### Structure

```
src/renderer/
├── common/
│   └── repo/           # Repository modules
│       ├── api.ts      # API client
│       └── index.ts    # Export
└── features/
    └── [feature]/
        └── repo/       # Feature-specific repos
            ├── appRepo.ts
            ├── configRepo.ts
            └── index.ts
```

### App Repository Example

```typescript
// src/renderer/features/installation/repo/appRepo.ts
import { ApiService, ServerResponse } from 'astra';

const ipcService = window.electronAPI; // Prana preload bridge

export const AppRepo = {
  getApps: async (): Promise<ServerResponse<App[]>> => {
    try {
      const data = await ipcService.invoke('app:list');
      return ServerResponse.success({
        status: 200,
        statusMessage: 'OK',
        data,
      });
    } catch (error) {
      return ServerResponse.error({
        status: 500,
        statusMessage: error instanceof Error ? error.message : 'Failed to load apps',
      });
    }
  },

  installApp: async (repoUrl: string): Promise<ServerResponse<App>> => {
    try {
      const data = await ipcService.invoke('app:install', { repoUrl });
      return ServerResponse.success({
        status: 201,
        statusMessage: 'App installed successfully',
        data,
      });
    } catch (error) {
      return ServerResponse.error({
        status: 500,
        statusMessage: error instanceof Error ? error.message : 'Installation failed',
      });
    }
  },

  uninstallApp: async (appId: string): Promise<ServerResponse<void>> => {
    try {
      await ipcService.invoke('app:uninstall', { appId });
      return ServerResponse.success({
        status: 200,
        statusMessage: 'App uninstalled',
        data: undefined,
      });
    } catch (error) {
      return ServerResponse.error({
        status: 500,
        statusMessage: error instanceof Error ? error.message : 'Uninstallation failed',
      });
    }
  },
};
```

## Using Repository with useDataState

```typescript
import { useDataState, StateType } from 'astra';
import { AppRepo } from '../repo/appRepo';

function AppListContainer() {
  const [appState, execute] = useDataState<App[]>();

  useEffect(() => {
    execute(() => AppRepo.getApps());
  }, []);

  if (appState.state === StateType.LOADING) {
    return <LoadingSpinner />;
  }

  if (appState.isError) {
    return <Alert severity="error">{appState.statusMessage}</Alert>;
  }

  return <AppGrid apps={appState.data || []} />;
}
```

## IPC vs External API

Chakra uses two types of repositories:

### 1. Prana IPC (Internal)
```typescript
import { ipcService } from 'prana';

// For Chakra's internal services
const AppRepo = {
  list: () => ipcService.invoke('app:list'),
  install: (url) => ipcService.invoke('app:install', { repoUrl: url }),
  uninstall: (id) => ipcService.invoke('app:uninstall', { appId: id }),
};
```

### 2. External API (Google Sheets)
```typescript
import { ApiService } from 'astra';

// For Google Sheets API
const sheetsApi = new ApiService(SHEETS_API_URL, {
  internal_server_error: 'Failed to fetch sheets.',
});

const SheetsRepo = {
  getSpreadsheet: (id) => sheetsApi.get(`/spreadsheets/${id}`),
  getSheetData: (spreadsheetId, sheetId) =>
    sheetsApi.get(`/spreadsheets/${spreadsheetId}/values/${sheetId}`),
};
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

## Error Handling

### Repository Error Pattern
```typescript
export const AppRepo = {
  getApps: async () => {
    try {
      const data = await ipcService.invoke('app:list');
      return ServerResponse.success({ status: 200, statusMessage: 'OK', data });
    } catch (error) {
      return ServerResponse.error({
        status: HttpStatusCode.INTERNAL_SERVER_ERROR,
        statusMessage: 'Failed to load apps',
      });
    }
  },
};
```

### UI Error Display
```typescript
const [appState, execute] = useDataState<App[]>();

// Display error from repository
if (appState.isError) {
  return (
    <Alert severity="error">
      {appState.statusMessage}
    </Alert>
  );
}
```

## Rules

- **Always use ServerResponse** for API returns
- **Use ipcService** for internal Chakra operations
- **Use ApiService** for external APIs
- **Handle errors** in repository layer
- **Return proper status codes** for all operations

## Related

- [MVVM Pattern](mvvm-pattern.md)
- [State Management](state-management.md)
- [Theming](theming.md)
- [Localization](localization.md)