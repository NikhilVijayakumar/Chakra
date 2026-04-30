# Design Specification — Chakra

> Premium Best-in-Class, Award-Winning Design System
> Modern Minimalist Tech-Noir · Dual-Mode · NEEV Rendering Pipeline
> This file is the canonical source of truth for all UI, styling, and visual work.
> Agents must read this before touching any visual artifact.

---

## Table of Contents

1. [Brand Philosophy](#1-brand-philosophy)
2. [Reference Matrix](#2-reference-matrix)
3. [Color System](#3-color-system)
4. [Typography](#4-typography)
5. [Spacing & Layout](#5-spacing--layout)
6. [Surface & Elevation](#6-surface--elevation)
7. [Theme System](#7-theme-system)
8. [Component Patterns](#8-component-patterns)
9. [Animation System](#9-animation-system)
10. [Interaction States](#10-interaction-states)
11. [Accessibility](#11-accessibility)
12. [Localization](#12-localization)
13. [MUI Token Mapping](#13-mui-token-mapping)
14. [Atomic Rules](#14-atomic-rules)
15. [Viewport Strategy](#15-viewport-strategy)
16. [Quality Checklist](#16-quality-checklist)

---

## 1. Brand Philosophy

**Chakra is a system-driven platform and living archive. The interface must communicate calm authority, intellectual rigor, and cinematic trust — comparable in quality to Apple, Linear, and Stripe.**

> If an element does not add meaning, remove it.

The brand rests on three non-negotiable pillars:

| Pillar | Description | Implementation |
|---|---|---|
| **Calm Intellect** | Design feels engineered and intentional | Strict spacing grid, perfect alignment, predictable rhythm |
| **Cinematic Restraint** | Information is immediately understandable | Typography-led hierarchy, minimal decoration, purposeful motion |
| **System-Driven** | Scalable logic defines structure | Deep Navy/Black base, limited palette, whitespace treated as a feature |

### The 10 Core Design Rules

1. **Radical Simplicity** — Remove anything that doesn't directly support clarity or function. If it doesn't improve usability, hierarchy, or comprehension, remove it.
2. **Precision in Spacing** — All spacing follows the 8px grid. Layouts feel engineered, not assembled.
3. **Typography Leads** — Hierarchy is established through type, spacing, and contrast — not decoration.
4. **Color as Guidance** — Accent colors highlight primary actions only. Neutral tones dominate.
5. **White Space is Feature** — Treat whitespace as an essential structural element, not empty space.
6. **Depth is Subtle** — Elevation through soft shadows. Never heavy drop shadows, never aggressive gradients.
7. **Motion is Purposeful** — Animation indicates state change and guides attention. Never decorative.
8. **Consistency Builds Trust** — Every element behaves predictably across every screen.
9. **Detail Reflects Craftsmanship** — Micro-spacing, alignment, corner radii, text balance — all matter.
10. **Restraint Defines Premium** — The most premium design is defined by what it chooses NOT to include.

### Premium Aesthetic Modes

**Tech-Noir (Dark Theme)** — Canonical experience. Pure order and restraint. Deep Navy/Black base, high-contrast typography, and gold/neon accents used strictly for meaning. 

**Professional Reading (Light Theme)** — Alternative viewing mode for accessibility and institutional trust. Bone/parchment surfaces with charcoal typography. Identical layout and motion.

> The final artifact must look meticulously crafted — as if labored over by a designer at the absolute top of their field. "Good enough" is unacceptable. The UI must feel like a calm, timeless archive.

---

## 2. Reference Matrix

Use these canonical benchmarks when making design decisions. Always cite the reference, not vague ideals.

| Layer | Reference | Key Extract | Signal |
|---|---|---|---|
| **Theme** | Apple | Token discipline, invisible shadows, spacing as hierarchy | How few colors are used; shadows nearly invisible |
| **Theme** | Stripe | Controlled gradient, strong type scale, mature light/dark | Modular type ratios; accent restraint |
| **Localization** | Airbnb | Multi-language sentence adaptation, clean RTL | Button resize, paragraph reflow, no clipping |
| **Viewport** | Notion | True mobile-first, comfortable desktop, 4K scaling | Container width caps, sidebar collapse, scroll ergonomics |
| **Component** | Atlassian | State coverage, consistent affordances, validation clarity | Disabled vs loading, error positioning, hit-area discipline |
| **Page** | Shopify | Hero → proof → CTA flow, strong vertical rhythm | Narrative sequencing, section breathing space |
| **Navigation** | Amazon | Deep but structured, strong breadcrumb, discoverability | Graph depth discipline, path clarity under complexity |
| **Premium** | Porsche | Massive whitespace, low noise density, minimal palette | Spacing dominance, hero calmness, typography restraint |
| **Emotion** | A24 | Strong emotional clarity, mood-driven layout, visual silence | Tone consistency, contrast shaping emotion |
| **Menus** | Figma | Structured clarity, logical grouping, balanced density | Menu psychology, footer symmetry, header consistency |
| **Enterprise** | IBM | Serious hierarchy, stable documentation layout, trust signals | Typography authority, structured content density |

### Animation References

| Emotion | Motion Style | Reference | Duration |
|---|---|---|---|
| Calm | Fade + minimal translate | A24 | 300–500ms |
| Trust | Subtle + predictable | IBM | 200–250ms |
| Premium | Slow + spacious | Porsche | 300–500ms |
| Energetic | Faster + higher contrast | Apple | 150–200ms |
| Playful | Spring + micro bounce | Figma | 120–200ms |
| System clarity | Fade + opacity | Stripe | 150–200ms |
| Precision SaaS | Tight + consistent | Linear | 120–200ms |

Instead of vague prompts like "make it premium," use:
- "Follow Porsche-level spacing restraint"
- "Use Stripe typography scale discipline"
- "Apply IBM predictable motion timing"
- "Maintain Airbnb localization elasticity"

---

## 3. Color System

> All values consumed via CSS variables. Never hardcode hex values in component styles.

### Brand Accent (Chakra Specific)

```ts
primary:       '#5A60F5'   // Soft indigo (Chakra Signature) — CTAs, primary actions, focus rings
primaryHover:  '#5255DF'   // Darker — interactive states
secondary:     '#8a8f98'   // Neutral secondary — icons, subtle elements
```

### Light Mode Palette (Professional & Reading-First)

```ts
// Backgrounds
background.default:  '#F7F6F2'   // Warm bone/parchment — never pure white
background.paper:    '#FFFFFF'   // Elevated surfaces — cards, modals

// Text
text.primary:    '#1A1C23'   // Charcoal / deep navy — headings, body
text.secondary:  '#687076'   // Muted — captions, metadata, hints

// Borders
border:  'rgba(0, 0, 0, 0.08)'  // Hairline separators

// Dividers
divider:  '#E5E7EB'  // Neutral 200 range
```

### Dark Mode Palette (Tech-Noir - Canonical)

```ts
// Backgrounds (layered — never pure black)
background.default:  '#090B10'   // Deep Navy / Soft Black — base layer
background.paper:    '#12141A'   // Slightly lighter — cards, drawers
background.panel:    '#1A1D24'   // Highest elevation — modals, popovers

// Text (4–5 contrast tiers)
text.primary:    '#F2F2F3'   // Warm off-white — headings, body
text.secondary:  '#8A8F98'   // Muted — captions, metadata

// Borders
border:  'rgba(255, 255, 255, 0.08)'  // Subtle separators
divider:  '#2C3240'  // Deep navy/gray — never pure black dividers
```

### Status Palette

```ts
error:    '#E05D6E'   // Errors, destructive actions
warning:  '#F2A73B'   // Warnings
success:  '#3AA664'   // Success states
info:     '#5A60F5'   // Informational
```

### Golden Color Rules

**Light Mode:**
- Avoid pure white (`#FFFFFF`) as the dominant surface — use `#F7F6F2` (bone/parchment)
- Use 3–5 neutral steps between surfaces
- Prefer space over borders to separate content
- Text: charcoal/deep navy (`#1A1C23`), not absolute black

**Dark Mode:**
- Avoid pure black (`#000000`) — use Deep Navy/Soft Black
- Maintain 4–5 surface tiers for depth
- Keep accent saturation controlled — never neon decoration
- Dividers: `Neutral Deep` range, never solid black lines

---

## 4. Typography

### Font Stack

```ts
sans:  '"Inter", "Segoe UI", "Helvetica Neue", Arial, sans-serif'
mono:  '"IBM Plex Mono", "Menlo", "Courier New", monospace'
```

### Type Scale

| Variant | Size | Weight | Line Height | Tracking | Usage |
|---|---|---|---|---|---|
| `h1` | 2rem (32px) | 600 | 1.2 | `-0.02em` | Page headings — monumental form |
| `h2` | 1.5rem (24px) | 600 | 1.3 | `-0.02em` | Section headings |
| `h3` | 1.25rem (20px) | 600 | 1.4 | `-0.01em` | Subsection headings |
| `h4` | 1.125rem (18px) | 600 | 1.4 | `0` | Card titles |
| `h5` | 1rem (16px) | 600 | 1.5 | `0` | Small headings |
| `h6` | 0.875rem (14px) | 600 | 1.5 | `0.02em` | Micro labels, uppercase |
| `body1` | 0.9375rem (15px) | 400 | 1.5 | `0` | Primary body — premium electron standard |
| `body2` | 0.8125rem (13px) | 400 | 1.5 | `0` | Secondary text, dense info |
| `body2Medium` | 0.8125rem (13px) | 500 | 1.5 | `0` | Emphasized body |
| `button` | 0.875rem (14px) | 500 | 1.0 | `0` | Buttons — no transform |
| `caption` | 0.75rem (12px) | 500 | 1.4 | `0.01em` | Labels, quiet context |
| `captionBold` | 0.75rem (12px) | 600 | 1.4 | `0.01em` | Bold labels |
| `overline` | 0.6875rem (11px) | 600 | 1.4 | `0.08em` | Section labels, uppercase |
| `monoBody` | 0.8125rem (13px) | 400 | 1.5 | `0` | Code, IDs, technical data |
| `monoCaption` | 0.75rem (12px) | 500 | 1.4 | `0` | Monospace captions |
| `micro` | 0.625rem (10px) | 600 | 1.2 | `0.04em` | Uppercase badges only |
| `splashTitle` | 0.875rem (14px) | 600 | 1.5 | `0.02em` | Display headers, wide tracking |
| `hero` | `clamp(2rem, 4vw, 3.5rem)` | 700 | 1.1 | `-0.03em` | Dashboard KPIs only |

### Typography Rules

- Body text: always `body1` (15px) or `body2` (13px). Never smaller than `caption` (12px) in production UI
- Headings: use semantic `<h1>–<h6>`, never `<div>` with font styling
- Line length: cap prose at `65ch` for readability
- `hero` variant: reserved exclusively for top-level dashboard KPI metrics
- All font sizes: use `rem`, never `px` — honor browser zoom
- All fluid sizes: use `clamp()` — never static pixel font sizes
- Hierarchy: drastic contrast between heading levels, not subtle steps
- Headers: deep negative tracking (`-0.02em`) for tight, cohesive visual blocks
- Labels/captions: uppercase with wide tracking (`0.02em`) for quiet context

---

## 5. Spacing & Layout

### Spacing Scale

Base unit: **8px** (MUI standard). All spacing must be multiples of 8px.

| Token | CSS Variable | Value | Pixels | Usage |
|---|---|---|---|---|
| `spacing-0` | `--spacing-0` | 0 | 0px | Reset |
| `spacing-1` | `--mui-spacing-1` | 1× | 8px | Tight internal gaps |
| `spacing-2` | `--mui-spacing-2` | 2× | 16px | Standard component padding |
| `spacing-3` | `--mui-spacing-3` | 3× | 24px | Internal component sections |
| `spacing-4` | `--mui-spacing-4` | 4× | 32px | Card padding, section gaps |
| `spacing-5` | `--mui-spacing-5` | 5× | 40px | Page sections |
| `spacing-6` | `--mui-spacing-6` | 6× | 48px | Section dividers |
| `spacing-8` | `--mui-spacing-8` | 8× | 64px | Major layout sections |
| `spacing-12` | `--mui-spacing-12` | 12× | 96px | Page-level separations |

### Border Radius

```ts
radius-sm:   4px    // Badges, chips, small buttons
radius-md:   8px    // Buttons, inputs (default)
radius-lg:   12px   // Cards
radius-xl:   16px   // Panels, modals
radius-2xl:  24px   // Hero cards, featured content
radius-full: 9999px // Pills, avatars
```

### Shadows (Light Mode — Dark Mode uses opacity reduction)

```ts
shadow-xs:  '0 1px 2px rgba(0,0,0,0.05)'
shadow-sm:  '0 1px 3px rgba(0,0,0,0.10), 0 1px 2px rgba(0,0,0,0.06)'
shadow-md:  '0 4px 6px rgba(0,0,0,0.07), 0 2px 4px rgba(0,0,0,0.06)'
shadow-lg:  '0 10px 15px rgba(0,0,0,0.10), 0 4px 6px rgba(0,0,0,0.05)'
shadow-xl:  '0 20px 25px rgba(0,0,0,0.10), 0 8px 10px rgba(0,0,0,0.04)'
```

Dark mode: `rgba(0,0,0,0.3)–rgba(0,0,0,0.5)` for same levels. Never flat in dark mode.

### Glassmorphism (webapp contexts only)

When the target platform permits glassmorphism, apply with deliberate constraint:
- Background opacity: `rgba(var(--bg-paper-rgb), 0.7)` minimum for text contrast
- Inset border: `1px solid rgba(255, 255, 255, 0.15)` to simulate glass edge
- Backdrop filter: `blur(20px) saturate(1.8)`
- Drop shadow: required to lift off background canvas

### Layout Rules

- Content max-width: `1280px` centered
- Page gutters: `16px` mobile, `32px` md+, `48px` xl+
- Section padding: `48px` minimum vertical
- Whitespace: structural element — use `spacing-6` (48px+) for section dividers

### Breakpoints

| Name | Min Width | Target |
|---|---|---|
| `xs` | 0px | Mobile base |
| `sm` | 600px | Tablet |
| `md` | 900px | Desktop sidebar visible |
| `lg` | 1200px | Multi-column grids |
| `xl` | 1920px | 4K density scaling |

Design **mobile-first**: base styles target `< 600px`.

---

## 6. Surface & Elevation

| Surface | Light Mode | Dark Mode | MUI Mapping |
|---|---|---|---|
| Default BG | `#F5F5F7` | `#0e1015` | `palette.background.default` |
| Paper/Card | `#FFFFFF` | `#16181D` | `palette.background.paper` |
| Panel/Modal | `#FFFFFF` | `#1E2028` | Highest elevation |
| AppBar | `#F5F5F7` | `#0e1015` | `MuiAppBar` overrides |
| Navigation | `#FFFFFF` | `#16181D` | `MuiDrawer` overrides |

> **Critical**: Dark mode requires `backgroundImage: 'none'` on Paper and AppBar to prevent MUI's default elevation overlays from interfering with the custom palette.

### Elevation Logic

- **No border** → Elevation replaces borders in light mode (Apple-reference)
- **Subtle border** → `1px solid var(--mui-divider)` where separation is required
- **Shadow** → Light use only; dark mode uses surface contrast, not shadows
- **AppBar**: always `border-bottom: 1px solid var(--mui-divider)`, `background-image: none`
- **Drawer**: `border-right: 1px solid var(--mui-divider)`

---

## 7. Theme System

### Architecture

```
ThemeProvider (wraps app)
    ├── lightTheme (MUI Theme Object)
    ├── darkTheme (MUI Theme Object)
    └── ThemeContext → useTheme() hook → ThemeToggle component
```

### Theme Toggle

- Attribute: `[data-theme="dark"]` on `<body>`
- Storage: `localStorage` key `"darkMode"` (boolean)
- All component styles inherit from `var(--mui-...)` CSS variables
- Hardcoded hex values in component styles are **strictly prohibited**

### CSS Variable Architecture

```css
:root {
  /* Light mode defaults */
  --mui-bg-default: #F5F5F7;
  --mui-bg-paper: #FFFFFF;
  --mui-text-primary: #111318;
  --mui-text-secondary: #687076;
  --mui-divider: #E5E7EB;
  --mui-primary-main: #5A60F5;
  --mui-radius-md: 8px;
  --mui-spacing-1: 8px;
  --mui-spacing-2: 16px;
  --mui-spacing-4: 32px;
}

[data-theme="dark"] {
  --mui-bg-default: #0e1015;
  --mui-bg-paper: #16181D;
  --mui-text-primary: #EDEDEF;
  --mui-text-secondary: #8A8F98;
  --mui-divider: #374151;
}
```

### Hover / Interaction States

| State | Light Mode | Dark Mode |
|---|---|---|
| Hover | `filter: brightness(0.95)` | `filter: brightness(1.1)` |
| Active/Pressed | `transform: scale(0.98)` | same |
| Disabled | `opacity: 0.5; cursor: not-allowed` | same |
| Focus | `outline: 2px solid var(--mui-primary-main); outline-offset: 2px` | same |

---

## 8. Component Patterns

### Buttons

| Variant | Background | Text | Border | Use Case |
|---|---|---|---|---|
| `primary` | `#5A60F5` | white | none | Main CTA |
| `secondary` | transparent | `#5A60F5` | `var(--mui-divider)` | Secondary actions |
| `ghost` | transparent | text primary | none | Tertiary, icon buttons |
| `danger` | `#ED5F74` | white | none | Destructive actions |
| `disabled` | neutral | neutral-300 | none | Unavailable state |

- Height: `36px` (default), `32px` (sm), `44px` (lg touch target)
- Border radius: `var(--mui-radius-md)` — 8px
- Text transform: always `none`
- Focus ring: `2px solid` with `2px` offset — never remove, only replace
- Hover: subtle elevation `translateY(-2px)` + shadow increase

### Card Surfaces

Cards are **containers for clarity, not decoration**.

Structure:
1. Title — clear heading
2. Supporting information — metadata, captions
3. Primary action or data — the core content

Rules:
- Soft surface contrast: `background: var(--mui-bg-paper)`
- Subtle elevation: `shadow-sm` light mode; surface contrast dark mode
- Internal padding: `spacing-3` (24px) minimum
- Never cramped, never overly decorated, never visually heavy
- `border-radius: var(--mui-radius-lg)` (12px)

### Data Tables

Tables prioritize **legibility and scanning speed**.

- Column alignment: clear, left-aligned text, right-aligned numbers
- Row separators: `1px solid var(--mui-divider)` — subtle, never heavy
- Row height: `52px` default, `40px` compact
- Row hover: `background: rgba(var(--primary-rgb), 0.04)`
- Avoid: dense rows, excessive grid lines, visual clutter
- Support: sorting (visual arrow indicators), filtering (inline or toolbar), selection (checkbox)

### Forms

Forms should feel **simple, structured, and calm**.

- Label: always above input, never placeholder-only
- Input height: `40px` default
- Input border: `1px solid var(--mui-divider)` → focus: `2px solid var(--mui-primary-main)`
- Error: border + helper text in `var(--mui-error-main)` — positioned below input
- Group related fields with `spacing-3` (24px) vertical gap between groups
- `spacing-2` (16px) between label and next field group
- Show only necessary fields — reduce friction

### Toolbars

- Clear grouping: primary actions left, secondary grouped right
- Icon usage: minimal — label when space permits
- Spacing: `spacing-1` (8px) between icons, `spacing-2` (16px) between groups
- Dividers: `1px solid var(--mui-divider)` vertical between groups

### Side Panels

Panels preserve context and **reduce navigation friction**.

- Width: `360px` default, `480px` wide variant
- Animation: `slideInRight 200ms cubic-bezier(0.4, 0, 0.2, 1)`
- Structure: header with title + close, scrollable content area, sticky footer with actions
- Content: focused — no unrelated information
- Avoid: overly wide panels, cluttered layouts

### Notifications / Toast

- Position: bottom-right (desktop), bottom (mobile)
- Duration: 3000ms success/info, 5000ms warning/error, manual dismiss for errors
- Style: minimal — icon + message + optional action
- Never: large intrusive alerts, excessive animations, overly bright colors
- Auto-dismiss with subtle fade-out animation

### Navigation (Sidebar)

- Width: `240px` expanded, `64px` collapsed
- Background: `var(--mui-bg-default)` — same as page, separated by `border-right`
- Active item: `background: rgba(var(--primary-rgb), 0.08)` + left accent border `3px solid var(--mui-primary-main)`
- Hover: `background: rgba(var(--primary-rgb), 0.04)`
- Section labels: `caption` variant, uppercase, `letter-spacing: 0.08em`, `color: var(--mui-text-secondary)`

### Form Inputs

```css
input {
  border: 1px solid var(--mui-divider);
  border-radius: var(--mui-radius-md);
  height: 40px;
  padding: 0 var(--mui-spacing-2);
}
input:focus {
  outline: none;
  border: 2px solid var(--mui-primary-main);
}
input.error {
  border-color: var(--mui-error-main);
}
```

### Z-Index Scale

```ts
z-base:     0
z-raised:   10
z-dropdown: 200
z-sticky:   300
z-overlay:  400
z-modal:    500
z-toast:    600
z-tooltip:  700
```

---

## 9. Animation System

### Core Principle

> Move less than you think. Animation is a structural amplifier, not decoration.

Premium animation must support structure, respect density, align with emotion, preserve restraint, and maintain intent consistency.

### Duration Tiers

| Type | Range | Reference |
|---|---|---|
| Micro-interaction | 120–200ms | Linear, Stripe |
| Navigation / panel | 200–300ms | IBM, Airbnb |
| Cinematic / reveal | 300–500ms | Porsche, A24 |

### Easing Functions

```css
/* Enterprise / Trust (IBM, Stripe) */
--ease-standard:  cubic-bezier(0.4, 0, 0.2, 1);

/* Decelerate / Entrance */
--ease-decelerate: cubic-bezier(0, 0, 0.2, 1);

/* Accelerate / Exit */
--ease-accelerate: cubic-bezier(0.4, 0, 1, 1);

/* Cinematic / Luxury (Porsche) */
--ease-luxury: cubic-bezier(0.25, 0.46, 0.45, 0.94);
```

Use a single easing family per emotion profile. Never mix easing styles within one flow.

### Transform Boundaries (Premium never exceeds these)

```css
scale:      <= 1.05   /* subtle lift */
translateY: <= 16px   /* entrance offset */
translateX: <= 24px   /* panel slide */
rotation:   <= 2deg   /* rare, icon only */
```

### Motion Frequency Limit

```text
Animated elements per viewport: <= 5
Simultaneous animations:        <= 3
```

### Standard Patterns

**Entrance (list/grid items):**
```css
@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
}
/* Staggered: delay += 50ms per item, max 5 items */
```

**Card hover lift:**
```css
.card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
  transition: transform 150ms var(--ease-standard),
              box-shadow 150ms var(--ease-standard);
}
```

**Side panel slide:**
```css
@keyframes slideInRight {
  from { transform: translateX(100%); opacity: 0; }
  to   { transform: translateX(0); opacity: 1; }
}
.side-panel { animation: slideInRight 200ms var(--ease-decelerate); }
```

**Skeleton loading:**
```css
@keyframes shimmer {
  from { background-position: -200% center; }
  to   { background-position: 200% center; }
}
.skeleton {
  background: linear-gradient(90deg, var(--mui-divider) 25%,
    rgba(255,255,255,0.1) 50%, var(--mui-divider) 75%);
  background-size: 200% auto;
  animation: shimmer 1.5s ease-in-out infinite;
}
```

### Reduced Motion

Always respect `prefers-reduced-motion`:
```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

### What NOT to Do

- Dribbble-heavy parallax chaos
- 20+ animated elements on load
- Auto-playing everything
- High-frequency bouncing / elastic effects
- Random durations per element
- Decorative animations with no functional purpose
- Bounce easing (`cubic-bezier` overshoot) in enterprise/trust contexts

---

## 10. Interaction States

All interactive elements must have clearly defined states:

| State | Visual Treatment |
|---|---|
| **Default** | Base style |
| **Hover** | `brightness(0.95)` light / `brightness(1.1)` dark + subtle lift |
| **Active/Pressed** | `scale(0.98)` — tactile feedback |
| **Focus** | `outline: 2px solid var(--mui-primary-main); outline-offset: 2px` |
| **Disabled** | `opacity: 0.5; cursor: not-allowed; pointer-events: none` |
| **Loading** | Skeleton or spinner — never block interaction unnecessarily |
| **Error** | Error color border + helper text below |
| **Success** | Fade-in success indicator — auto-dismiss |

### Hover (Cards and Actionable Elements)

- Subtle negative translation: `transform: translateY(-2px)` + shadow increase
- Never trigger aggressive layout shifts on hover
- Duration: `150ms var(--ease-standard)`

### Focus (Keyboard Navigation — Required)

```css
:focus-visible {
  outline: 2px solid var(--mui-primary-main);
  outline-offset: 2px;
  border-radius: inherit;
}
```

---

## 11. Accessibility

Accessibility improves usability for all users. These are not optional — they are requirements.

### Color Contrast

- Body text: minimum **4.5:1** (WCAG AA)
- Large text (18px+ or 14px bold): minimum **3:1**
- Interactive elements: minimum **3:1**
- Always test both light and dark mode
- Use `--mui-text-primary` on `--mui-bg-default` — never assume contrast

### Semantic HTML

| Requirement | Rule |
|---|---|
| Landmarks | Every page: `<header>`, `<main>`, `<nav>`, `<footer>` |
| Headings | Logical nesting H1→H2→H3. Never skip levels |
| Buttons vs Links | `<button>` for actions, `<a>` for navigation |
| Forms | Every input has associated `<label>` (not placeholder only) |

### Interactive Targets

- Minimum touch target: **44×44px** (WCAG 2.5.5)
- All interactive elements keyboard-reachable
- Visible `:focus-visible` on all interactive elements

### ARIA

| Element | Attribute | Purpose |
|---|---|---|
| Decorative icons | `aria-hidden="true"` | Screen reader skip |
| Action icons (no text) | `aria-label="[intent]"` | Announces function |
| Status indicators | `role="status"` | Live updates |
| Form inputs | `aria-labelledby` or `aria-label` | Label association |
| Expanded elements | `aria-expanded="true/false"` | State communication |
| Selected items | `aria-selected="true/false"` | Selection state |

### Typography Accessibility

- All font sizes in `rem` — respect browser zoom
- Body text: minimum `line-height: 1.5`
- Header text: minimum `line-height: 1.2`
- Text over images: minimum 40% opacity scrim
- Never use color alone to convey meaning

---

## 12. Localization

### Architecture

```
LanguageProvider → LanguageContext → useLanguage() hook
```

### Hook Usage

```tsx
const { literal } = useLanguage();
<h1>{literal["header.title"]}</h1>
<button>{literal["ui.save"]}</button>
```

### Key Naming Conventions

| Pattern | Example |
|---|---|
| `category.key` | `ui.save`, `msg.error` |
| `component.key` | `header.title`, `footer.copyright` |
| `screen.action` | `login.submit`, `settings.reset` |

### Zero Hardcoding Policy

```ts
// Correct
{ "attendance.selected": "{{count}} employees selected" }

// Wrong — breaks word order in other languages
{ "attendance.count": "{{count}}", "attendance.employees": "employees selected" }
```

### Pluralization

```ts
{
  "alerts.one": "You have 1 pending alert",
  "alerts.other": "You have {{count}} pending alerts"
}
```

### RTL Support

- Use CSS logical properties: `margin-inline-start` not `margin-left`
- Apply `dir="rtl"` at `<html>` element
- Mirror directional icons: `transform: scaleX(-1)`

### Date & Number Formatting

Always use `Intl` API — never manual formatting:
```ts
new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(date)
new Intl.NumberFormat(locale).format(number)
```

---

## 13. MUI Token Mapping

The translation layer from React theme objects to CSS variables.

### Color Mapping

| React Theme Property | CSS Variable | Semantic Context |
|---|---|---|
| `palette.primary.main` | `--mui-primary-main` | Primary actions |
| `palette.secondary.main` | `--mui-secondary-main` | Secondary elements |
| `palette.background.default` | `--mui-bg-default` | Page background |
| `palette.background.paper` | `--mui-bg-paper` | Cards, modals, surfaces |
| `palette.text.primary` | `--mui-text-primary` | High-contrast text |
| `palette.text.secondary` | `--mui-text-secondary` | Subtitles, hints |
| `palette.divider` | `--mui-divider` | Borders, separators |
| `palette.error.main` | `--mui-error-main` | Error states |
| `palette.success.main` | `--mui-success-main` | Success states |
| `palette.warning.main` | `--mui-warning-main` | Warning states |

### Component-Specific Overrides

**AppBar:**
```css
border-bottom: 1px solid var(--mui-divider);
background-image: none; /* prevents MUI elevation overlay */
```

**Drawer (Sidebar):**
```css
background: var(--mui-bg-default);
border-right: 1px solid var(--mui-divider);
```

**Buttons:**
```css
border-radius: var(--mui-radius-md); /* 8px */
text-transform: none;
```

### Verification Anchor Tags

Inject on elements for the Verification Project:
- `data-mui-color` — elements using primary/secondary colors
- `data-mui-variant` — typography elements (e.g., `data-mui-variant="h5"`)
- `data-mui-spacing` — containers using specific gap/padding logic
- `data-neev-viewport` — root container per viewport
- `data-neev-intent` — all interactive elements
- `data-a11y-role` — complex component roles
- `data-section` — every major Organism for visual auditing

---

## 14. Atomic Rules

### The Three Layers

| Layer | Definition | MUI Mapping |
|---|---|---|
| **Atoms** | Smallest functional units: Icons, Typography, Buttons | `MuiButton`, `MuiTypography`, `MuiIcon` |
| **Molecules** | Groups of Atoms: Search Bar, Status Chip, Attendance Row | `MuiBox` (with children), `MuiCardHeader` |
| **Organisms** | Complex sections: Navigation Sidebar, Table with Filters | `MuiAppBar`, `MuiDrawer`, `MuiDataGrid` |

### The 8px Grid Rule (Absolute)

- All `padding`, `margin`, `gap` values: multiples of **8px**
- Never use hardcoded pixel values (e.g., `15px`) — always use CSS variables
- Standard molecule gap: `var(--mui-spacing-2)` (16px) unless feature docs specify otherwise
- Molecules: use `display: flex` or `display: grid`

### Typography Enforcement

- Never override `font-size` in component styles — use foundation variables
- Heading elements: `<h1>–<h6>`, never styled `<div>`
- Fluid scaling: always use `clamp()` values from foundations for viewport adaptation
- `hero` variant: dashboard KPI values only

### No Hardcoding (Strict)

```css
/* NEVER */
color: #5A60F5;
font-size: 14px;
padding: 15px;
width: 400px;

/* ALWAYS */
color: var(--mui-primary-main);
font-size: var(--type-button);
padding: var(--mui-spacing-2);
width: clamp(300px, 30vw, 480px);
```

### No `<a>` Tags with Hardcoded URLs

```html
<!-- NEVER -->
<a href="/attendance">Go to Attendance</a>

<!-- ALWAYS -->
<button data-neev-intent="route-to-attendance">Go to Attendance</button>
```

### Mockup Purity (Stateless Blueprints)

- No `<script>` tags with business logic inside markup files
- Interactivity: CSS `:hover`, `:active`, `:focus` states only
- Dynamic data: `{{handlebars}}` placeholders mapped to `locals/*.json`

---

## 15. Viewport Strategy

### Supported Viewport Matrix

| Viewport | Resolution | Aspect Ratio | Focus |
|---|---|---|---|
| **4K** | 3840×2160 | 16:9 | Maximum information density, multi-column organisms |
| **2K/1440p** | 2560×1440 | 16:9 | High-fidelity dashboarding, generous whitespace |
| **1080p** | 1920×1080 | 16:9 | Standard desktop "Source of Truth" |
| **Tablet** | 768×1024 | 3:4 | Touch-friendly molecules, vertical stacking |
| **Mobile** | 375×812 | 9:19.5 | Single-column flow, collapsed navigation |

### Fluid Layout Rules

```css
/* Containers: never stretch on ultrawide */
max-width: var(--viewport-max-width, 1280px);
margin-inline: auto;

/* Gaps: breathe as screen grows */
gap: clamp(var(--mui-spacing-1), 2vw, var(--mui-spacing-4));

/* Flex containers: never overflow */
flex-wrap: wrap;
```

### Safe Zones

- **4K**: Keep critical actions within a central `2560px` container — prevent neck strain
- **Mobile**: Maintain minimum `16px` horizontal margin from screen edge
- **Touch targets**: minimum `44×44px` on tablet and mobile

### Viewport-Specific Considerations

- **Desktop**: Prioritize information density and horizontal layouts
- **Mobile/Tablet**: Prioritize vertical stacking, touch-friendly targets, single-column flow
- **Sidebar**: Visible on `md` (900px+), collapsed/hidden on mobile

---

## 16. Quality Checklist

Apply before releasing any screen, component, or interface.

### Structure & Hierarchy

- [ ] Purpose of screen is immediately clear — user understands it within seconds
- [ ] Most important information is visually dominant
- [ ] Secondary elements clearly subordinate
- [ ] Hierarchy established through typography, spacing, contrast — not color alone

### Spacing & Alignment

- [ ] All spacing follows 8px grid
- [ ] Margins consistent throughout
- [ ] Elements align to grid structure
- [ ] No visual tension from misalignment
- [ ] Internal component spacing is balanced

### Typography

- [ ] Line height is comfortable (body: 1.5, headings: 1.2+)
- [ ] Font weights are consistent and intentional
- [ ] Headings and body clearly differentiated
- [ ] No more than 2 font weights on a single screen
- [ ] No dense text blocks without breathing room

### Color

- [ ] Accent colors highlight key actions only
- [ ] Neutral colors dominate the interface
- [ ] Color meaning is consistent throughout
- [ ] No decorative color usage
- [ ] Dark mode: no pure blacks, layered surfaces
- [ ] Light mode: no pure white dominant surfaces

### Components

- [ ] Buttons look consistent across screens
- [ ] Cards follow the same layout logic
- [ ] Form elements behave predictably
- [ ] Interactive elements clearly identifiable

### Motion & Interaction

- [ ] Hover states visible and comfortable
- [ ] Transitions smooth (120–300ms, appropriate easing)
- [ ] System feedback clear and timely
- [ ] No decorative animations
- [ ] `prefers-reduced-motion` respected

### Accessibility

- [ ] Text contrast: 4.5:1 minimum for body text
- [ ] Focus states visible on all interactive elements
- [ ] Touch targets: 44×44px minimum
- [ ] Semantic HTML structure (landmarks, heading hierarchy)
- [ ] ARIA attributes on complex components

### Polish & Craft

- [ ] Icon alignment precise
- [ ] Text truncation handled gracefully
- [ ] Corner radii consistent throughout
- [ ] Subtle spacing differences resolved
- [ ] Nothing unnecessary remaining

### Final Standard

> If a screen feels visually effortless, it has likely achieved the Chakra design quality standard.
> 
> Premium design is not about adding more. It is about removing everything unnecessary.

---

## Related Documentation

| Document | Purpose |
|---|---|
| `docs/design/theme.md` | NEEV theme contract |
| `docs/design/premium-aesthetics.md` | Tech-Noir aesthetic guidelines |
| `docs/design/mui-tokens.md` | MUI token to CSS variable mapping |
| `docs/design/atomic-rules.md` | Structural hierarchy and grid rules |
| `docs/brand/BAVANS Theme Reference System.md` | Theme references |
| `docs/brand/BAVANS – Developer & Design Directive.md` | Developer guidelines |
| `docs/brand/Bavans – Core Idea & Vision.md` | Brand narrative and vision |

---

*Last updated: April 2026 · Design System — Chakra · NEEV Rendering Pipeline*
