# Architecture: Theming

Chakra follows **Astra's theming system** based on Material UI with custom tokens.

## Theme Structure

```
Theme System
├── ThemeProvider      # MUI theme wrapper
├── Light Theme      # Light mode tokens
├── Dark Theme      # Dark mode tokens
└── ThemeTokens    # Custom design tokens
```

## ThemeProvider Setup

Wrap Chakra with `ThemeProvider` at app root:

```typescript
import { ThemeProvider, ThemeToggle } from 'astra';
import { createTheme } from '@mui/material/styles';

const lightTheme = createTheme({
  palette: { mode: 'light' },
  // Custom tokens
  tokens: {
    primary: { main: '#1976d2' },
    secondary: { main: '#9c27b0' },
  },
});

const darkTheme = createTheme({
  palette: { mode: 'dark' },
  tokens: {
    primary: { main: '#90caf9' },
    secondary: { main: '#ce93d8' },
  },
});

export function ChakraApp() {
  return (
    <ThemeProvider lightTheme={lightTheme} darkTheme={darkTheme}>
      <ThemeToggle /> {/* Light/Dark toggle button */}
      <MainContent />
    </ThemeProvider>
  );
}
```

## Design Tokens

Chakra uses Astra's design tokens:

| Token | Usage | Example |
|-------|-------|--------|
| `primary` | Main brand color | Buttons, links |
| `secondary` | Accent color | Tags, highlights |
| `success` | Success states | `#2e7d32` |
| `warning` | Warning states | `#ed6c02` |
| `error` | Error states | `#d32f2f` |
| `info` | Info states | `#0288d1` |

### Using Theme in Components

```typescript
import { useTheme } from 'astra';

function MyComponent() {
  const theme = useTheme(); // Returns MUI theme object

  return (
    <Box
      sx={{
        backgroundColor: theme.palette.primary.main,
        color: theme.palette.text.primary,
      }}
    >
      Hello
    </Box>
  );
}
```

## Theme Toggle

Use `ThemeToggle` component for light/dark switching:

```typescript
import { ThemeToggle } from 'astra';

// In any Chakra screen:
function AppHeader() {
  return (
    <AppBar>
      <Toolbar>
        <Typography>Chakra</Typography>
        <Box sx={{ flexGrow: 1 }} />
        <ThemeToggle /> {/* Automatic light/dark toggle */}
      </Toolbar>
    </AppBar>
  );
}
```

## Custom Theme Extensions

Extend Astra theme with Chakra-specific tokens:

```typescript
const chakraTheme = createTheme({
  ...baseTheme,
  tokens: {
    ...baseTheme.tokens,
    chakra: {
      cardBackground: '#ffffff',
      sidebarBackground: '#f5f5f5',
      dialogBackground: '#ffffff',
      tableRowHover: '#fafafa',
    },
  },
});
```

## Chakra Theme Structure

Chakra's theme follows this structure:

```
src/renderer/
├── common/
│   └── theme/
│       ├── lightTheme.ts     # Light theme config
│       ├── darkTheme.ts    # Dark theme config
│       ├── tokens.ts      # Custom tokens
│       └── index.ts      # Theme exports
└── main.tsx              # ThemeProvider wrapper
```

## Using Tokens in Chakra Components

### DO: Use Theme Tokens
```typescript
// ✅ Correct - use theme tokens
<Box sx={{ backgroundColor: 'primary.main' }}>
  Content
</Box>
```

### DON'T: Hardcode Colors
```typescript
// ❌ Wrong - hardcoded color
<Box sx={{ backgroundColor: '#1976d2' }}>
  Content
</Box>
```

## Rules

- **Never hardcode colors** — always use theme tokens
- **Use ThemeProvider** at app root
- **Use useTheme hook** for theme access
- **Include ThemeToggle** in headers/toolbars
- **Support both** light and dark modes

## Related

- [MVVM Pattern](mvvm-pattern.md)
- [State Management](state-management.md)
- [Localization](localization.md)