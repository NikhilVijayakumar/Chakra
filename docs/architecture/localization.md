# Architecture: Localization (i18n)

Chakra follows **Astra's localization system** for internationalization.

## Localization Structure

```
Localization System
├── LanguageProvider    # i18n context wrapper
├── useLanguage Hook     # Access translations
├── Translation Files   # Per-language files
└── Available Languages # Language config
```

## LanguageProvider Setup

Wrap Chakra with `LanguageProvider` at app root:

```typescript
import { LanguageProvider, useLanguage } from 'astra';

const translations = {
  en: {
    'app.title': 'Chakra',
    'app.install': 'Install App',
    'app.uninstall': 'Uninstall',
    'app.list': 'Installed Apps',
    'app.noApps': 'No apps installed',
  },
  es: {
    'app.title': 'Chakra',
    'app.install': 'Instalar App',
    'app.uninstall': 'Desinstalar',
    'app.list': 'Apps Instaladas',
    'app.noApps': 'No hay apps instaladas',
  },
};

const availableLanguages = [
  { code: 'en', label: 'English' },
  { code: 'en', label: 'Español' },
];

export function ChakraApp() {
  return (
    <LanguageProvider
      translations={translations}
      availableLanguages={availableLanguages}
      defaultLanguage="en"
    >
      <MainContent />
    </LanguageProvider>
  );
}
```

## useLanguage Hook

Use `useLanguage` hook to access translations:

```typescript
import { useLanguage } from 'astra';

function AppList() {
  const { t, language, setLanguage, availableLanguages } = useLanguage();

  return (
    <div>
      <h1>{t('app.title')}</h1>
      <button onClick={() => setLanguage('es')}>
        {availableLanguages.find(l => l.code === language)?.label}
      </button>
      <AppGrid apps={apps} />
    </div>
  );
}
```

## Translation Key Patterns

### Naming Convention

```
{domain}.{page}.{element}

app.list.title        → 'Installed Apps'
app.install.button  → 'Install App'
app.settings.save   → 'Save Settings'
error.notFound     → 'Not Found'
```

### Translation Files Structure

```
src/renderer/
├── common/
│   └── localization/
│       ├── en.json     # English translations
│       ├── es.json     # Spanish translations
│       ├── ta.json     # Tamil translations
│       └── index.ts   # Translation exports
```

## Translation JSON Format

```json
// en.json
{
  "app": {
    "title": "Chakra",
    "install": "Install App",
    "uninstall": "Uninstall",
    "list": "Installed Apps",
    "noApps": "No apps installed",
    "update": "Update Available",
    "settings": "Settings"
  },
  "auth": {
    "login": "Login",
    "logout": "Logout",
    "username": "Username",
    "password": "Password"
  },
  "common": {
    "save": "Save",
    "cancel": "Cancel",
    "confirm": "Confirm",
    "loading": "Loading...",
    "error": "Error"
  }
}
```

## Using Translations in Components

### DO: Use Translation Keys
```typescript
// ✅ Correct - use translation key
function AppListHeader() {
  const { t } = useLanguage();

  return (
    <Box>
      <Typography variant="h4">{t('app.list.title')}</Typography>
      <Button>{t('app.install.button')}</Button>
    </Box>
  );
}
```

### DON'T: Hardcode Strings
```typescript
// ❌ Wrong - hardcoded string
function AppListHeader() {
  return (
    <Box>
      <Typography variant="h4">Installed Apps</Typography>
      <Button>Install App</Button>
    </Box>
  );
}
```

## Language Switching

### Per-Component Language
```typescript
function LanguageSelector() {
  const { language, setLanguage, availableLanguages } = useLanguage();

  return (
    <Select
      value={language}
      onChange={(e) => setLanguage(e.target.value)}
    >
      {availableLanguages.map(lang => (
        <MenuItem key={lang.code} value={lang.code}>
          {lang.label}
        </MenuItem>
      ))}
    </Select>
  );
}
```

### Global Language (persist to cache)
```typescript
function LanguageSelector() {
  const { language, setLanguage } = useLanguage();

  const handleChange = async (newLang: string) => {
    setLanguage(newLang);
    // Persist to cache
    await ipcService.invoke('config:setLanguage', newLang);
  };

  return <Select value={language} onChange={e => handleChange(e.target.value)} />;
}
```

## Chakra Translations

### Core Translations (en.json)

```json
{
  "app": {
    "title": "Chakra",
    "install": "Install App",
    "uninstall": "Uninstall",
    "list": "Installed Apps",
    "noApps": "No apps installed"
  },
  "governance": {
    "title": "Governance",
    "access": "Access Control",
    "roles": "Roles"
  },
  "settings": {
    "title": "Settings",
    "appearance": "Appearance",
    "language": "Language"
  }
}
```

## Rules

- **Never hardcode strings** — always use translation keys
- **Use LanguageProvider** at app root
- **Use useLanguage hook** for translations
- **Follow key pattern**: `{domain}.{page}.{element}`
- **Support languages**: English (en), expandable

## Related

- [MVVM Pattern](mvvm-pattern.md)
- [State Management](state-management.md)
- [Theming](theming.md)