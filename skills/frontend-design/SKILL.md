---
name: frontend-design
description: Create distinctive, production-grade frontend interfaces with Astra's premium design system. Use this skill when building web components, React components, pages, dashboards, or any web UI. Follows the design philosophy of Precision, Clarity, and Restraint from docs/rules/ and design aesthetics from docs/references/ (Linear, Stripe, Vercel).
license: Complete terms in LICENSE.txt
---

# Frontend Design

Create distinctive, production-grade frontend interfaces using Astra's premium design system. This skill aligns with `design.md`, `docs/design/`, `docs/references/`, and `docs/rules/`.

## Design Philosophy

Astra follows three core principles (from docs/rules/Core Design Rules.md):

| Principle | Description | Implementation |
|---|---|---|
| **Precision** | Design feels engineered and intentional | Strict spacing grid, consistent alignment |
| **Clarity** | Information is immediately understandable | Typography-led hierarchy |
| **Restraint** | Minimalism elevates focus and elegance | Limited color palette |

**Never default to generic AI aesthetics.** Every interface should feel intentionally designed.

## Understanding the Context

Before implementation, understand:

1. **Purpose** — What problem does this solve? Who uses it?
2. **Tone** — Pick an extreme: brutally minimal, maximalist, retro-futuristic, luxury/refined, editorial, industrial/utilitarian
3. **Technical** — Framework (React, Vue, etc.), performance, accessibility requirements
4. **Differentiation** — What's the one memorable element?

**CRITICAL**: Choose a clear conceptual direction and execute it with precision.

## Implementation Reference

### Theme System (from `src/common/theme/`)

```
ThemeProvider → ThemeContext → useTheme hook
```

Light/dark mode with:
- Design tokens (colors, spacing, typography)
- MUI theming infrastructure
- localStorage persistence

### Localization (from `src/common/localization/`)

```
LanguageProvider → LanguageContext → useLanguage hook
```

For all user-visible strings, use the localization system:
```tsx
const { literal } = useLanguage();
<h1>{literal["ui.title"]}</h1>
```

## Design Tokens

### Colors (from `src/theme/tokens/colors.ts`)

**Brand:**
```ts
primary: '#5A60F5'      // Soft indigo
primaryHover: '#5255DF'
secondary: '#8a8f98'
```

**Light Mode Background:**
```ts
background.light: '#F5F5F7'    // Barely gray, NOT pure white
paperLight: '#FFFFFF'       // Elevated surface
```

**Dark Mode Background:**
```ts
background.dark: '#0e1015'   // Deep gray, NOT black
paperDark: '#16181D'         // Slightly lighter
panelDark: '#1E2028'         // Highest elevation
```

**Text:**
```ts
// Light mode
text.primary: '#111318'     // Near-black
text.secondary: '#687076'   // Muted

// Dark mode
text.primary: '#EDEDEF'      // Near-white
text.secondary: '#8A8F98' // Muted
```

**Status:**
```ts
error: '#ED5F74'
warning: '#F5A623'
success: '#34C759'
info: '#5A60F5'
```

### Typography (from `src/theme/tokens/typography.ts`)

**Font Stack:**
```ts
sans: '"Inter", "Segoe UI", "Helvetica Neue", sans-serif'
mono: '"IBM Plex Mono", "Menlo", "Courier New", monospace'
```

**Body Text:**
- `body1`: 0.9375rem (15px) — primary body, standard for premium Electron apps
- `body2`: 0.8125rem (13px) — secondary text
- `caption`: 0.75rem (12px) — labels, never smaller in production

**Rule:** Typography leads the interface — rely on type, spacing, and contrast over decoration.

### Spacing (from `src/theme/tokens/spacing.ts`)

Base unit: **4px**

| Token | Value | Pixels |
|---|---|---|
| xs | 1 | 8px |
| sm | 1.5 | 12px |
| md | 2 | 16px |
| lg | 3 | 24px |
| xl | 4 | 32px |
| xxl | 6 | 48px |

**Rule:** Precision in spacing — follow strict alignment and rhythm.

### Surfaces & Elevation

| Surface | Light | Dark |
|---|---|---|
| Default BG | `#F5F5F7` | `#0e1015` |
| Paper/Card | `#FFFFFF` | `#16181D` |
| AppBar | `#F5F5F7` | `#0e1015` |

Rule: In dark mode, use `backgroundImage: 'none'` on Paper/AppBar to avoid MUI elevation overlay.

### Interaction States

| State | Light | Dark |
|---|---|---|
| Hover | `filter: brightness(0.95)` | `filter: brightness(1.1)` |
| Active | `transform: scale(0.98)` | same |
| Disabled | `opacity: 0.5`, `cursor: not-allowed` | same |

## Component Patterns

### Buttons

| Variant | Background | Text | Border | Use |
|---|---|---|---|---|
| primary | `#5A60F5` | white | none | Main CTA |
| secondary | transparent | `#5A60F5` | `#5A60F5` 1px | Secondary |
| ghost | transparent | text | none | Tertiary |
| danger | `#ED5F74` | white | none | Destructive |

- Height: 36px default, 32px sm, 44px lg
- Focus ring: 2px solid with 2px offset

### Forms

- Border: 1px solid `rgba(0,0,0,0.08)` → focus state
- Label: always above input, never placeholder-only

### Z-Index Scale

```ts
z-base: 0
z-raised: 10
z-dropdown: 200
z-sticky: 300
z-overlay: 400
z-modal: 500
z-toast: 600
z-tooltip: 700
```

## Premium Aesthetic Guidelines

### Typography

- Choose distinctive, interesting fonts — avoid generic system fonts
- Pair a distinctive display font with a refined body font
- Use 15px (body1) as primary — common in premium apps like Linear
- Typography leads the interface

### Color & Theme

- Use CSS variables for consistency
- Dominant colors with sharp accents outperform timid palettes
- Light: Soft white (#F5F5F7), not pure white
- Dark: Deep gray (#0e1015), NOT black
- Accent under 10% surface coverage

### Motion

- Use animations for high-impact moments
- Prefer CSS-only solutions
- Focus on page load reveals with staggered delays
- Use hover states that surprise
- Respect `prefers-reduced-motion`

### Spatial Composition

- Unexpected layouts
- Asymmetry, overlap, diagonal flow
- Grid-breaking elements
- Generous negative space OR controlled density

### Backgrounds & Texture

- Create atmosphere, not flat colors
- Gradient meshes, noise, geometric patterns
- Layered transparencies
- Dramatic shadows, custom cursors, grain

## Golden Rules (from docs/references/theme.md)

### Light Mode
- Avoid pure white as dominant surface
- Use 3-5 neutral steps
- Prefer space over borders
- Text: near-black, not absolute black
- Accents under 10% coverage

### Dark Mode
- Avoid pure black (#000000)
- Use layered dark grays (4-5 tiers)
- Keep accent saturation controlled
- Ensure 4-5 text contrast tiers
- Don't over-glow buttons

## What to AVOID

- Pure white (#FFFFFF) everywhere in light mode
- Pure black (#000000) in dark mode
- Harsh black text
- Generic fonts (Arial, Inter, Roboto as defaults)
- Purple gradients on white backgrounds
- Neon blue/purple glow spam
- Decorative elements without purpose
- Overly stylized type
- Dense text blocks
- Heavy drop shadows
- Inconsistent spacing

## Accessibility (from design.md)

- **Contrast**: 4.5:1 minimum (WCAG AA)
- **Focus**: Every interactive element keyboard-reachable
- **Touch targets**: minimum 44×44px
- **Reduced motion**: respect `prefers-reduced-motion`
- **Forms**: Every input with associated `<label>`

## Execution

1. **Choose direction** — Pick an aesthetic and commit
2. **Apply tokens** — Use colors, spacing, typography above
3. **Build components** — Follow patterns in `src/common/theme/`
4. **Enhance** — Animation, micro-interactions
5. **Validate** — Check accessibility and premium checklist

**Match complexity to vision:** Maximalist designs need elaborate code. Minimalist designs need precision and restraint.

Remember: Claude creates extraordinary work. Commit fully to a distinctive vision.

---
For complete reference, see: `design.md`, `docs/design/theme-and-localization.md`, `docs/rules/Core Design Rules.md`, `docs/references/theme.md`, `src/theme/tokens/`