---
name: design-tokens
description: Apply Astra's design tokens system for consistent visual design. Use when building components, pages, or any UI that needs consistent colors, spacing, typography, or shadows. Based on src/theme/tokens/ implementation with tokens from design.md — includes colors, spacing, typography, and shadows following Precision, Clarity, Restraint principles.
license: Complete terms in LICENSE.txt
---

# Design Tokens

Apply Astra's design tokens system for consistent visual design. Based on `src/theme/tokens/` implementation.

## Design Philosophy

| Principle | Description |
|---|---|
| **Precision** | Tokens feel engineered, not arbitrary |
| **Clarity** | Each token has clear purpose |
| **Restraint** | Limited palette, consistent usage |

---

## Color Tokens

### Brand Colors (from `src/theme/tokens/colors.ts`)

```ts
primary: '#5A60F5'       // Soft indigo — main accent
primaryHover: '#5255DF'  // Interactive state
secondary: '#8a8f98'   // Neutral, icons
```

### Background — Light Mode

```ts
background.light: '#F5F5F7'  // Page — NOT pure white
paperLight: '#FFFFFF'          // Cards, elevated
```

### Background — Dark Mode

```ts
background.dark: '#0e1015'  // Page — NOT pure black
paperDark: '#16181D'        // Cards
panelDark: '#1E2028'        // Highest elevation
```

### Text — Light Mode

```ts
text.primary: '#111318'    // Headings, body
text.secondary: '#687076'  // Captions, metadata
```

### Text — Dark Mode

```ts
text.primary: '#EDEDEF'    // Headings, body
text.secondary: '#8A8F98' // Captions, metadata
```

### Status Colors

```ts
error: '#ED5F74'
warning: '#F5A623'
success: '#34C759'
info: '#5A60F5'
crisis: '#F85149'  // Critical alerts
```

### Borders

```ts
border.light: 'rgba(0, 0, 0, 0.08)'
border.dark: 'rgba(255, 255, 255, 0.08)'
```

---

## Spacing Tokens

Base unit: **4px** (from `src/theme/tokens/spacing.ts`)

| Token | Value | Pixels | Usage |
|---|---|---|---|
| `internal` | 0.5 | 4px | Tight gaps |
| `xs` | 1 | 8px | Icon gaps |
| `sm` | 1.5 | 12px | Small padding |
| `md` | 2 | 16px | Standard padding |
| `lg` | 3 | 24px | Section gaps |
| `xl` | 4 | 32px | Large gaps |
| `xxl` | 6 | 48px | Page sections |
| `section` | 8 | 64px | Major sections |
| `page` | 12 | 96px | Full page |

---

## Typography Tokens

### Font Stack

```ts
sans: '"Inter", "Segoe UI", "Helvetica Neue", sans-serif'
mono: '"IBM Plex Mono", "Menlo", "Courier New", monospace'
```

### Type Scale (from `src/theme/tokens/typography.ts`)

| Variant | Size | Weight | Line Height | Usage |
|---|---|---|---|---|
| h1 | 2rem (32px) | 600 | 1.2 | Page headings |
| h2 | 1.5rem (24px) | 600 | 1.3 | Section headings |
| h3 | 1.25rem (20px) | 600 | 1.4 | Subsection |
| h4 | 1.125rem (18px) | 600 | 1.4 | Card titles |
| body1 | 0.9375rem (15px) | 400 | 1.5 | Primary body |
| body2 | 0.8125rem (13px) | 400 | 1.5 | Secondary text |
| caption | 0.75rem (12px) | 500 | 1.4 | Labels |
| micro | 0.625rem (10px) | 600 | 1.2 | Badges |

### Custom Variants

```ts
monoBody:     // Monospace body
monoCaption: // Monospace small
body2Medium: // Medium weight body
body2Bold:   // Bold body
captionBold: // Bold caption
splashTitle: // Wide tracking uppercase
splashSubtitle: // Extended caption
```

---

## Shadow Tokens

```ts
shadow-xs:   0 1px 2px rgba(0,0,0,0.05)
shadow-sm:   0 1px 3px rgba(0,0,0,0.10), 0 1px 2px rgba(0,0,0,0.06)
shadow-md:   0 4px 6px rgba(0,0,0,0.07), 0 2px 4px rgba(0,0,0,0.06)
shadow-lg:   0 10px 15px rgba(0,0,0,0.10), 0 4px 6px rgba(0,0,0,0.05)
shadow-xl:   0 20px 25px rgba(0,0,0,0.10), 0 8px 10px rgba(0,0,0,0.04)
```

---

## Border Radius

```ts
radius-sm:   4px
radius-md:   8px
radius-lg:   12px
radius-xl:   16px
radius-2xl: 24px
radius-full: 9999px
```

---

## Z-Index Scale

```ts
z-base:    0
z-raised:  10
z-dropdown: 200
z-sticky:  300
z-overlay: 400
z-modal:   500
z-toast:   600
z-tooltip: 700
```

---

## Interaction States

### Hover

```css
/* Light mode */
:hover {
  filter: brightness(0.95);
}

/* Dark mode */
[data-theme="dark"] :hover {
  filter: brightness(1.1);
}
```

### Active

```css
:active {
  transform: scale(0.98);
  transition: transform 100ms ease-out;
}
```

### Disabled

```css
:disabled,
[disabled] {
  opacity: 0.5;
  cursor: not-allowed;
  pointer-events: none;
}
```

---

## Surface & Elevation

| Surface | Light | Dark |
|---|---|---|
| Default BG | `#F5F5F7` | `#0e1015` |
| Paper/Card | `#FFFFFF` | `#16181D` |
| AppBar | `#F5F5F7` | `#0e1015` |
| Navigation | `#FFFFFF` | `#16181D` |

**Critical:** Dark mode uses `backgroundImage: 'none'` on Paper to avoid MUI elevation overlay.

---

## Using Tokens in Code

### CSS Variables

```css
:root {
  /* Colors */
  --color-primary: #5A60F5;
  --color-primary-hover: #5255DF;
  --color-secondary: #8a8f98;
  
  /* Background — Light */
  --color-bg: #F5F5F7;
  --color-paper: #FFFFFF;
  
  /* Background — Dark */
  --color-bg-dark: #0e1015;
  --color-paper-dark: #16181D;
  
  /* Text */
  --color-text: #111318;
  --color-text-muted: #687076;
  
  /* Spacing */
  --space-xs: 8px;
  --space-sm: 12px;
  --space-md: 16px;
  --space-lg: 24px;
  --space-xl: 32px;
  
  /* Typography */
  --font-sans: "Inter", "Segoe UI", sans-serif;
  --font-mono: "IBM Plex Mono", monospace;
  
  /* Shadows */
  --shadow-sm: 0 1px 3px rgba(0,0,0,0.10);
  --shadow-md: 0 4px 6px rgba(0,0,0,0.07);
  --shadow-lg: 0 10px 15px rgba(0,0,0,0.10);
  
  /* Radius */
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 12px;
}

/* Dark mode */
[data-theme="dark"] {
  --color-bg: #0e1015;
  --color-paper: #16181D;
  --color-text: #EDEDEF;
  --color-text-muted: #8A8F98;
}
```

### React/MUI Usage

```tsx
import { colors } from './theme/tokens/colors';
import { spacing } from './theme/tokens/spacing';
import { typography } from './theme/tokens/typography';

function Component() {
  return (
    <Box
      sx={{
        color: 'text.primary',
        px: spacing.md,      // 16px
        py: spacing.lg,    // 24px
        borderRadius: '8px', // radius.md
        boxShadow: 'sm',
      }}
    >
      <Typography variant="body1">
        Content
      </Typography>
    </Box>
  );
}
```

---

## Golden Rules

### Light Mode
- Avoid pure white (#FFFFFF) as dominant surface
- Use 3-5 neutral steps
- Prefer space over borders
- Text: near-black (#111318), not absolute black

### Dark Mode
- Avoid pure black (#000000)
- Use layered dark grays (4-5 tiers)
- Keep accent saturation controlled
- Ensure text contrast tiers

---

## Token Usage Checklist

- [ ] Colors from token system (not hardcoded)
- [ ] Spacing from 4px base unit scale
- [ ] Typography from defined variants
- [ ] Shadows subtle, not heavy
- [ ] Radius consistent with scale
- [ ] Z-index from scale
- [ ] Surfaces match light/dark tokens

---
For complete reference, see: `design.md`, `src/theme/tokens/colors.ts`, `src/theme/tokens/spacing.ts`, `src/theme/tokens/typography.ts`