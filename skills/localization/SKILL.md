---
name: localization
description: Apply localization system to avoid hardcoded text. Use when creating UI components, dialogs, forms, or any display text. All user-visible strings must use the useLanguage hook from docs/feature/localization. Even for English-only, use the translation system for consistency.
license: Complete terms in LICENSE.txt
---

# Localization System

All user-visible text must be externalized via the localization system, even for English-only. This ensures consistency and easy translation.

## Design Philosophy

| Principle | Description |
|---|---|
| **No Hardcoded Text** | All visible strings use the localization system |
| **Translation First** | Even English-only apps use translation structure |
| **Runtime Switching** | Language can change without app restart |

## Core Usage

### useLanguage Hook

```tsx
import { useLanguage } from "../../localization/LanguageContext";

const MyComponent = () => {
  const { literal } = useLanguage();

  return <Typography>{literal["ui.title"]}</Typography>;
};
```

### LanguageProvider Setup

```tsx
import { LanguageProvider } from "../../localization/LanguageProvider";

const translations = {
  en: {
    "ui.save": "Save",
    "ui.cancel": "Cancel",
    "ui.delete": "Delete",
    "msg.welcome": "Welcome back",
    "msg.saved": "Changes saved",
    "msg.error": "An error occurred",
  },
  es: {
    "ui.save": "Guardar",
    "ui.cancel": "Cancelar",
    "ui.delete": "Eliminar",
    "msg.welcome": "Bienvenido de nuevo",
    "msg.saved": "Cambios guardados",
    "msg.error": "Ha ocurrido un error",
  },
};

const availableLanguages = [
  { code: "en", label: "English" },
  { code: "es", label: "Español" },
];

<LanguageProvider
  translations={translations}
  availableLanguages={availableLanguages}
>
  <YourApp />
</LanguageProvider>
```

## Key Naming Conventions

| Pattern | Example | Use Case |
|---|---|---|
| `ui.action` | `ui.save`, `ui.cancel` | Button labels, actions |
| `ui.label` | `ui.name`, `ui.email` | Form labels |
| `ui.placeholder` | `ui.email_placeholder` | Input placeholders |
| `msg.success` | `msg.saved`, `msg.deleted` | Success messages |
| `msg.error` | `msg.error_generic` | Error messages |
| `msg.info` | `msg.loading` | Info messages |
| `title.screen` | `title.dashboard` | Screen titles |
| `title.section` | `title.details` | Section headers |
| `empty.message` | `empty.no_data` | Empty state messages |
| `confirm.message` | `confirm.delete` | Confirmation dialogs |

## Translation Structure

Organize translations as flat key-value objects:

```ts
const translations = {
  en: {
    // UI Actions
    "ui.save": "Save",
    "ui.cancel": "Cancel",
    "ui.delete": "Delete",
    "ui.edit": "Edit",
    "ui.search": "Search",
    "ui.filter": "Filter",
    "ui.sort": "Sort",

    // Form Labels
    "form.name": "Name",
    "form.email": "Email",
    "form.password": "Password",
    "form.name_placeholder": "Enter your name",

    // Messages
    "msg.welcome": "Welcome back",
    "msg.saved": "Changes saved",
    "msg.deleted": "Item deleted",
    "msg.error_generic": "An error occurred",
    "msg.loading": "Loading...",

    // Titles
    "title.dashboard": "Dashboard",
    "title.settings": "Settings",
    "title.profile": "Profile",

    // Empty States
    "empty.no_data": "No data available",
    "empty.no_results": "No results found",

    // Confirmations
    "confirm.delete": "Are you sure you want to delete this?",
    "confirm.logout": "Are you sure you want to log out?",

    // Time
    "time.last_checked": "Last checked",
    "time.updated": "Updated",
  },
};
```

## Component Patterns

### Basic Text Usage

```tsx
// ❌ Wrong - hardcoded
<Typography>Save</Typography>

// ✅ Correct - from localization
const { literal } = useLanguage();
<Typography>{literal["ui.save"]}</Typography>
```

### Form Labels

```tsx
// ❌ Wrong
<TextField label="Email" />

// ✅ Correct
const { literal } = useLanguage();
<TextField label={literal["form.email"]} />
```

### Empty States

```tsx
// ❌ Wrong
<Typography>No data available</Typography>

// ✅ Correct
const { literal } = useLanguage();
<Typography>{literal["empty.no_data"]}</Typography>
```

### Error Messages

```tsx
// ❌ Wrong
<Alert severity="error">An error occurred</Alert>

// ✅ Correct
const { literal } = useLanguage();
<Alert severity="error">{literal["msg.error_generic"]}</Alert>
```

### Button Labels

```tsx
// ❌ Wrong
<Button>Save Changes</Button>

// ✅ Correct
const { literal } = useLanguage();
<Button>{literal["ui.save"]}</Button>
```

### Placeholders

```tsx
// ❌ Wrong
<TextField placeholder="Enter email" />

// ✅ Correct
const { literal } = useLanguage();
<TextField placeholder={literal["form.email_placeholder"]} />
```

### Dialog Content

```tsx
// ❌ Wrong
<DialogTitle>Confirm Delete</DialogTitle>
<DialogContentText>Are you sure?</DialogContentText>

// ✅ Correct
const { literal } = useLanguage();
<DialogTitle>{literal["confirm.delete_title"]}</DialogTitle>
<DialogContentText>{literal["confirm.delete_message"]}</DialogContentText>
```

## Default Translation Keys

Every app should at minimum have these keys:

```ts
const defaultEn = {
  // UI
  "ui.save": "Save",
  "ui.cancel": "Cancel",
  "ui.delete": "Delete",
  "ui.edit": "Edit",
  "ui.search": "Search",
  "ui.close": "Close",
  "ui.submit": "Submit",
  "ui.confirm": "Confirm",

  // Messages
  "msg.loading": "Loading...",
  "msg.saved": "Changes saved",
  "msg.deleted": "Item deleted",
  "msg.error_generic": "An error occurred",

  // Empty
  "empty.no_data": "No data available",
  "empty.no_results": "No results found",

  // Confirmations
  "confirm.delete": "Are you sure?",
  "confirm.action": "Are you sure you want to proceed?",
};
```

## Backward Compatibility

For components that might be used without LanguageProvider, use defaults:

```tsx
const MyComponent = () => {
  const { literal } = useLanguage();

  // Safe access with fallback
  const title = literal["ui.title"] || "Title";
  const noData = literal["empty.no_data"] || "No data available";

  return (
    <Box>
      <Typography>{title}</Typography>
      <Typography>{noData}</Typography>
    </Box>
  );
};
```

## Component Audit Checklist

Before creating any component:

- [ ] All display text uses `literal["key"]` pattern
- [ ] All labels use translation keys
- [ ] All buttons use translation keys
- [ ] All placeholders use translation keys
- [ ] All messages use translation keys
- [ ] All empty states use translation keys
- [ ] All error states use translation keys

## What NOT to Do

- ❌ Hardcode button text: `<Button>Save</Button>`
- ❌ Hardcode labels: `<TextField label="Name" />`
- ❌ Hardcode messages: `<Alert>Error!</Alert>`
- ❌ Hardcode placeholders: `<input placeholder="Email" />`
- ❌ Hardcode empty states: `<Typography>No data</Typography>`

## Reference

- [Localization README](../feature/localization/README.md)
- [Localization Patterns](../feature/localization/patterns.md)
- [Localization Provider](../feature/localization/provider.md)
- [Localization Hooks](../feature/localization/hooks.md)
- `src/common/localization/LanguageContext.ts`
- `src/common/localization/LanguageProvider.tsx`