---
name: premium-ui-patterns
description: Apply premium award-winning UI patterns to build best-in-class interfaces for RITA. Use when designing any UI component, dashboard, form, table, or screen. Enforces Clarity/Structure/Restraint principles at Apple/Stripe/Linear quality level with full dark and light theme specifications. Covers 10 core patterns with dark/light CSS implementation, animation specs, accessibility requirements, and anti-patterns. Based on design.md, docs/rules/Premium UI Patterns.md, and docs/references/.
license: Complete terms in LICENSE.txt
---

# Premium UI Patterns — RITA

Apply these patterns to every RITA interface. Premium is defined by **clarity, hierarchy, and restraint** — not visual complexity. Reference: `design.md`, `docs/rules/Premium UI Patterns.md`, `docs/references/general.md`.

---

## Core Pattern Philosophy

| Principle | Description | Anti-Pattern |
|---|---|---|
| **Clarity** | Information immediately understandable | Competing messages, ambiguous labels |
| **Structure** | Layouts feel engineered and balanced | Dense layouts, random spacing |
| **Restraint** | Visual design minimal and intentional | Decorative elements, excessive color |

Every pattern decision maps to a canonical reference:
- **Porsche** — spacing restraint
- **Stripe** — type discipline and system feedback
- **Linear** — micro-interaction precision
- **Apple** — elevation and token discipline
- **IBM** — enterprise motion stability
- **Atlassian** — state coverage and validation clarity

---

## 1. Card Surfaces

Cards are **containers for clarity, not decoration**.

### Anatomy

```
┌─────────────────────────────────┐
│  Title                          │  h4 / h5 — confident, clear
│  Supporting info / metadata     │  caption — muted, secondary
│                                 │
│  Primary data or content        │  body1 / hero — the core value
│                                 │
│  Action (optional)              │  ghost or secondary button
└─────────────────────────────────┘
```

### Specifications

| Property | Light Mode | Dark Mode |
|---|---|---|
| Background | `#FFFFFF` | `#16181D` |
| Border | `1px solid rgba(0,0,0,0.08)` | `1px solid rgba(255,255,255,0.06)` |
| Shadow | `shadow-sm` | none — surface contrast |
| Border radius | `12px` (radius-lg) | same |
| Padding | `24px` (spacing-3) minimum | same |

### Hover State

```css
.card {
  transition: transform 150ms cubic-bezier(0.4, 0, 0.2, 1),
              box-shadow 150ms cubic-bezier(0.4, 0, 0.2, 1);
}
.card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 6px rgba(0,0,0,0.07), 0 2px 4px rgba(0,0,0,0.06);
}
```

### Rules

- Never cramped — padding minimum `24px`
- Never overly decorated — no heavy borders or gradients
- Never visually heavy — `shadow-sm` maximum for cards
- Title: `h4` or `h5` depending on hierarchy level
- Supporting info: `caption` or `body2` in `--mui-text-secondary`
- Metric cards: use `hero` variant for the primary value only

---

## 2. KPI / Metric Cards (Dashboard)

High-value data surfaces for attendance dashboards, muster reports, and organization-level metrics.

### Anatomy

```
┌──────────────────────────────┐
│  TOTAL EMPLOYEES             │  overline — uppercase, muted, 11px
│                              │
│  1,247                       │  hero — clamp(2rem, 4vw, 3.5rem), weight 700
│                              │
│  ↑ 3.2% vs last month       │  caption — success/error color + icon
└──────────────────────────────┘
```

### Specifications

- Overline: `0.6875rem`, `600`, `letter-spacing: 0.08em`, uppercase, `--mui-text-secondary`
- KPI value: `hero` variant, `--mui-text-primary`
- Trend: `caption`, semantic color (green for positive, red for negative)
- Trend icon: `aria-hidden="true"`, 14px, vertically centered
- Grid: 3–4 columns on desktop, 2 on tablet, 1 on mobile

---

## 3. Data Tables

Tables prioritize **legibility and scanning speed**.

### Column Alignment

| Content Type | Alignment |
|---|---|
| Text (names, labels) | Left |
| Numbers, dates | Right |
| Status chips | Center |
| Actions | Right (pinned) |

### Specifications

| Property | Light Mode | Dark Mode |
|---|---|---|
| Header background | `#F5F5F7` | `#0e1015` |
| Row background (default) | `#FFFFFF` | `#16181D` |
| Row background (hover) | `rgba(90,96,245,0.04)` | `rgba(90,96,245,0.06)` |
| Row separator | `1px solid rgba(0,0,0,0.06)` | `1px solid rgba(255,255,255,0.06)` |
| Row height | `52px` default, `40px` compact | same |
| Header text | `caption` uppercase, `--mui-text-secondary` | same |
| Cell text | `body2` / `body2Medium`, `--mui-text-primary` | same |

### Status Badges / Chips

```
Present    → green background (rgba(52,199,89,0.1)), green text
Absent     → red background (rgba(237,95,116,0.1)), red text
Late       → amber background (rgba(245,166,35,0.1)), amber text
Leave      → blue background (rgba(90,96,245,0.1)), blue text
```

- `border-radius: 4px` (radius-sm)
- `font-size: 0.75rem`, weight 600
- Padding: `2px 8px`

### Features Required

- Sorting: visual arrow indicators on sortable columns
- Filtering: toolbar or inline filter chips
- Pagination: bottom bar, clear page count, never infinite scroll for bulk data
- Row selection: checkbox column when bulk actions required
- Empty state: center-aligned illustration + message + CTA

### Rules

- Avoid dense rows — minimum `52px` row height
- Avoid excessive grid lines — use row separators, not column lines
- Avoid visual clutter — one primary action per row (ellipsis menu for secondary)

---

## 4. Attendance Calendar / Grid View

Specialized pattern for attendance tracking — the primary RITA use case.

### Cell Structure (Per Day / Employee)

```
┌───────┐
│  14   │  date number — h6, center
│  ●    │  status dot — 8px circle, semantic color
└───────┘
```

### Status Color Encoding

| Status | Dot Color | Background |
|---|---|---|
| Present | `#34C759` | `rgba(52,199,89,0.06)` |
| Absent | `#ED5F74` | `rgba(237,95,116,0.06)` |
| Late | `#F5A623` | `rgba(245,166,35,0.06)` |
| Half-day | Gradient split | transparent |
| Holiday | `#5A60F5` | `rgba(90,96,245,0.06)` |
| Leave | `#8a8f98` | `rgba(138,143,152,0.06)` |
| No data | — | transparent |

### Calendar Rules

- Today: `border: 2px solid var(--mui-primary-main)`, slightly elevated
- Weekend: muted background `rgba(0,0,0,0.02)` light / `rgba(255,255,255,0.01)` dark
- Holiday: subtle fill, no dot — use overline text label instead
- Selected: `background: rgba(90,96,245,0.12)`, border highlighted
- Legend: always visible above the calendar, horizontal, compact

---

## 5. Hero / Page Header Sections

Hero sections introduce a page with **confidence and clarity**.

### Structure

```
┌─────────────────────────────────────────────┐
│                                             │
│  Attendance Overview           [Month ▼] [Filter] [Export]
│  April 2026 · 247 employees               │
│                                             │
└─────────────────────────────────────────────┘
```

### Specifications

- Page title: `h1` (32px) or `h2` (24px) depending on nesting level
- Subtitle / context: `body2`, `--mui-text-secondary`
- Actions: right-aligned on desktop, stacked on mobile
- Padding: `spacing-4` (32px) vertical, `spacing-4` (32px) horizontal
- Border: `border-bottom: 1px solid var(--mui-divider)` to separate from content

### Rules

- One clear title — never two competing headlines
- Subtitle: 1 line of context only
- Actions: maximum 3 in the header bar; overflow to kebab menu
- Avoid heavy graphics or decorative background elements in hero areas

---

## 6. Forms

Forms should feel **simple, structured, and calm**.

### Field Anatomy

```
Label text                      ← body2Medium, #111318 light / #EDEDEF dark
┌──────────────────────────┐
│  Placeholder or value    │   ← 40px height, radius-md, divider border
└──────────────────────────┘
Helper text or error           ← caption, secondary / error color
```

### Specifications

| Property | Value |
|---|---|
| Input height | `40px` |
| Border default | `1px solid var(--mui-divider)` |
| Border focus | `2px solid var(--mui-primary-main)` |
| Border error | `2px solid var(--mui-error-main)` |
| Border radius | `8px` (radius-md) |
| Label position | Always above — never placeholder-only |
| Field gap | `24px` (spacing-3) between fields |
| Group gap | `32px` (spacing-4) between field groups |

### Dark Mode Input

```css
[data-theme="dark"] input {
  background: var(--mui-bg-paper);    /* #16181D */
  color: var(--mui-text-primary);
  border-color: var(--mui-divider);   /* #374151 */
}
[data-theme="dark"] input:focus {
  border-color: var(--mui-primary-main);
  box-shadow: 0 0 0 3px rgba(90, 96, 245, 0.15);
}
```

### Form Layout Rules

- Show only necessary fields — HR forms should be concise
- Group related inputs: `Personal Info`, `Schedule`, `Approvals`
- Required fields: asterisk `*` in `--mui-error-main`, explained in form intro
- Primary action: right-aligned, `primary` variant
- Secondary action: `ghost` variant, left of primary
- Never: dense stacked fields without visual grouping

---

## 7. Action Toolbars

Toolbars provide **quick access to key actions** without interrupting flow.

### Structure

```
[Primary CTA]    [Secondary]    [  ──  ]    [Filter ▼] [Sort ▼]    [Search       ]
```

### Rules

- Primary actions: left-aligned, text + icon
- Secondary / utility: right-aligned
- Divider: `1px solid var(--mui-divider)` vertical between logical groups
- Icon buttons: `36px` height, `36px` width minimum, `aria-label` required
- Spacing between icons: `8px` (spacing-1)
- Spacing between groups: `16px` (spacing-2)
- Maximum visible actions: 4–5; overflow into kebab `...` menu

---

## 8. Contextual Side Panels

Side panels preserve context and **reduce navigation friction**.

### Specifications

| Property | Value |
|---|---|
| Width | `360px` default, `480px` wide |
| Background | `var(--mui-bg-paper)` |
| Border left | `1px solid var(--mui-divider)` |
| Header padding | `20px 24px` |
| Content padding | `24px` |
| Footer padding | `16px 24px` |
| Footer background | `var(--mui-bg-default)` |
| Footer border top | `1px solid var(--mui-divider)` |

### Animation

```css
.side-panel {
  animation: slideInRight 200ms cubic-bezier(0, 0, 0.2, 1);
}
@keyframes slideInRight {
  from { transform: translateX(100%); opacity: 0; }
  to   { transform: translateX(0); opacity: 1; }
}
.side-panel.closing {
  animation: slideOutRight 150ms cubic-bezier(0.4, 0, 1, 1);
}
```

### Structure

```
┌─ Side Panel ─────────────────────┐
│  [←] Employee Details   [✕]     │  Header — h5, close button
├──────────────────────────────────┤
│                                  │
│  Section heading                 │  h6, uppercase, muted
│  Label          Value            │  body2 / body2Medium rows
│  Label          Value            │
│                                  │
│  Section heading                 │
│  ...                             │
│                                  │
├──────────────────────────────────┤
│           [Cancel] [Save]        │  Footer — sticky
└──────────────────────────────────┘
```

---

## 9. Notification Feedback

Feedback without disruption.

### Toast / Snackbar

| Property | Value |
|---|---|
| Position | Bottom-right desktop, bottom-center mobile |
| Duration | 3000ms success/info, 5000ms warning/error |
| Width | `320px` desktop, `calc(100% - 32px)` mobile |
| Border radius | `8px` (radius-md) |
| Shadow | `shadow-lg` |
| Z-index | `600` |
| Animation in | `fadeInUp 200ms ease-decelerate` |
| Animation out | `fadeOut 150ms ease-accelerate` |

### Semantic Variants

```css
.toast-success { border-left: 3px solid #34C759; }
.toast-warning { border-left: 3px solid #F5A623; }
.toast-error   { border-left: 3px solid #ED5F74; }
.toast-info    { border-left: 3px solid #5A60F5; }
```

Background: `var(--mui-bg-paper)` with subtle opacity. Never full-saturation colored backgrounds.

### Rules

- Message: 1–2 sentences, plain language
- Action (optional): 1 secondary action max, `ghost` text button
- Auto-dismiss: success and info only; errors require manual dismiss or action
- Never: multiple toasts stacked; large intrusive alerts; bright background fills

---

## 10. Empty States

Empty states are a **design opportunity** — the first impression during onboarding and the fallback during data absence.

### Structure

```
┌─────────────────────────────────┐
│                                 │
│         [Icon / Illustration]   │  40–48px, --mui-text-secondary opacity 0.5
│                                 │
│      No attendance records      │  h3 or h4 — confident, clear
│      found for this period.     │
│                                 │
│      [+ Mark Attendance]        │  primary CTA — single action
│                                 │
└─────────────────────────────────┘
```

### Rules

- Always provide a clear next action — never dead-end the user
- Icon: minimal, `--mui-text-secondary`, never colorful
- Title: clear statement of state
- Description: 1 sentence explaining why / what to do
- CTA: one primary action aligned to the user's goal
- Entrance animation: `fadeInUp 300ms ease-decelerate`

---

## Navigation Sidebar

### Specifications

| Property | Value |
|---|---|
| Width expanded | `240px` |
| Width collapsed | `64px` |
| Background | `var(--mui-bg-default)` |
| Border right | `1px solid var(--mui-divider)` |
| Item height | `44px` minimum (touch target) |
| Item padding | `0 16px` |
| Item radius | `8px` (radius-md) |
| Active background | `rgba(90,96,245,0.08)` |
| Active border left | `3px solid var(--mui-primary-main)` |
| Hover background | `rgba(90,96,245,0.04)` |
| Section label | `overline`, uppercase, `letter-spacing: 0.08em`, `--mui-text-secondary` |
| Section label margin | `24px` top, `8px` bottom |

### Navigation Item States

```css
.nav-item {
  height: 44px;
  border-radius: 8px;
  transition: background 120ms cubic-bezier(0.4, 0, 0.2, 1);
}
.nav-item:hover { background: rgba(90, 96, 245, 0.04); }
.nav-item.active {
  background: rgba(90, 96, 245, 0.08);
  border-left: 3px solid var(--mui-primary-main);
  font-weight: 500;
}
```

---

## Loading States

Never block the user — show immediate feedback.

### Skeleton Screens

```css
.skeleton {
  background: linear-gradient(
    90deg,
    var(--mui-divider) 25%,
    rgba(255,255,255,0.08) 50%,
    var(--mui-divider) 75%
  );
  background-size: 200% auto;
  animation: shimmer 1.5s ease-in-out infinite;
  border-radius: 4px;
}
@keyframes shimmer {
  from { background-position: -200% center; }
  to   { background-position: 200% center; }
}
```

Dark mode: use `rgba(255,255,255,0.06)` as the shimmer highlight.

### Spinner (for async actions)

- 20px diameter, `--mui-primary-main` stroke, `stroke-width: 2px`
- Rotation: `800ms linear infinite` — never bouncy
- Never block entire page with a spinner — use inline or button state

---

## Premium Pattern Rules (Universal)

Apply these to every pattern, every screen:

### Spacing

- Internal component spacing: minimum `spacing-2` (16px)
- Section-level spacing: minimum `spacing-6` (48px)
- Never: inconsistent margins, uneven padding, odd pixel values

### Typography in Components

- Titles: `h4` or `h5` in cards, panels, table headers
- Body: `body2` for dense data, `body1` for readable content
- Labels: `caption` or `overline` for metadata
- Values: `body2Medium` or `body1` for data points

### Color in Components

- Neutral surfaces dominate — accent used only for active, selected, or primary action states
- Status colors: semantic only — never decorative
- Dark mode: background-image: none on Paper and AppBar

### Interaction in Components

- Every interactive element: hover state + focus state
- Focus: `outline: 2px solid var(--mui-primary-main); outline-offset: 2px`
- Touch targets: minimum `44×44px`
- Transitions: `120–200ms cubic-bezier(0.4, 0, 0.2, 1)`

---

## Implementation Checklist

Before shipping any component or screen:

- [ ] Cards: soft elevation, comfortable padding, clear hierarchy
- [ ] Tables: readable row height, minimal borders, sort/filter supported
- [ ] Calendar: status colors consistent with legend, today highlighted
- [ ] Forms: labels above inputs, grouped logically, error states present
- [ ] Toolbars: actions grouped logically, icon hit targets ≥ 44×44px
- [ ] Panels: smooth slide animation, focused content, sticky footer
- [ ] Notifications: non-intrusive, auto-dismiss on success
- [ ] Empty states: clear message + primary CTA
- [ ] Loading: skeleton before data, spinner for async actions only
- [ ] All: accessible contrast ratios, keyboard-reachable, focus visible

---

For complete system: `design.md` · `docs/rules/Premium UI Patterns.md` · `docs/references/general.md` · `docs/references/animations.md`
