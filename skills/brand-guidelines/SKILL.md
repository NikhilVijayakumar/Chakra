---
name: brand-guidelines
description: Apply RITA's premium award-winning design system to any visual artifact. Use when creating UI, presentations, documents, or any visual material. Enforces Precision/Clarity/Restraint principles at Apple/Stripe/Notion quality level with full dual dark/light theme specifications. Covers brand identity, color tokens, typography, spacing, reference aesthetics, interaction states, motion governance, and the 14-point quality checklist from design.md and docs/.
license: Complete terms in LICENSE.txt
---

# Brand Guidelines — RITA

Full brand system for all RITA visual artifacts. This skill enforces `design.md`, `docs/design/`, `docs/references/`, and `docs/rules/`. When any of those files conflict with what's here, the source files win.

---

## Brand Position

RITA must feel comparable to **Apple, Stripe, and Notion** — not in copying their visual style, but in matching their level of care, precision, and restraint.

The experience communicates:
- calm authority
- high craftsmanship
- precision and trust
- modern elegance

RITA must **never feel trendy, loud, or decorative**. The name means *foundation* — stability, clarity, structure.

> Premium brands win awards through restraint, precision, and consistency. Not through visual complexity.

---

## Design Philosophy

Three non-negotiable pillars:

| Pillar | Description | Failure Mode |
|---|---|---|
| **Precision** | Engineered, intentional — strict grid, consistent alignment | Inconsistent spacing, random margins |
| **Clarity** | Immediately understandable — typography hierarchy, purposeful color | Competing visual messages, dense layouts |
| **Restraint** | Minimalism elevates — limited palette, no decoration | Too many colors, visual noise, gratuitous animation |

---

## Color System

> NEVER hardcode hex values in component styles. Always use CSS variables.

### Brand Accent

| Token | Value | Usage |
|---|---|---|
| `--mui-primary-main` | `#5A60F5` | CTAs, focus rings, active states |
| `--primary-hover` | `#5255DF` | Button hover, link hover |
| `--secondary` | `#8a8f98` | Secondary icons, subtle elements |

### Light Mode Palette

| Surface | Token | Hex | Usage |
|---|---|---|---|
| Page background | `--mui-bg-default` | `#F5F5F7` | Never pure white |
| Cards / elevated | `--mui-bg-paper` | `#FFFFFF` | Modals, drawers |
| Heading / body | `--mui-text-primary` | `#111318` | Near-black, not absolute |
| Captions / meta | `--mui-text-secondary` | `#687076` | Muted secondary |
| Borders | `--mui-divider` | `rgba(0,0,0,0.08)` | Hairline separators |

### Dark Mode Palette

| Surface | Token | Hex | Usage |
|---|---|---|---|
| Page background | `--mui-bg-default` | `#0e1015` | Deep charcoal, not black |
| Cards / elevated | `--mui-bg-paper` | `#16181D` | Slightly lighter |
| Panels / modals | `--bg-panel` | `#1E2028` | Highest elevation |
| Heading / body | `--mui-text-primary` | `#EDEDEF` | Near-white |
| Captions / meta | `--mui-text-secondary` | `#8A8F98` | Muted |
| Borders | `--mui-divider` | `#374151` | Neutral 700, never black |

### Status Colors

| Status | Hex | Usage |
|---|---|---|
| Error | `#ED5F74` | Errors, destructive |
| Warning | `#F5A623` | Warnings |
| Success | `#34C759` | Success states |
| Info | `#5A60F5` | Informational |
| Crisis | `#F85149` | Critical / emergency |

### Golden Color Rules

**Light Mode:**
- Page background: `#F5F5F7` — avoid pure white (`#FFFFFF`) as dominant surface
- Use 3–5 neutral steps between surfaces
- Prefer whitespace over borders to separate content
- Text: near-black `#111318`, not absolute black

**Dark Mode:**
- Never use pure black `#000000` — use layered charcoals
- Maintain 4–5 surface elevation tiers
- Accent saturation: controlled — never neon
- Dividers: `Neutral 700` range, never solid black lines
- Accent glow: only on key elements, and only when it serves clarity

---

## Typography

### Font Stack

```
Sans-serif: "Inter", "Segoe UI", "Helvetica Neue", Arial, sans-serif
Monospace:  "IBM Plex Mono", "Menlo", "Courier New", monospace
```

### Type Scale

| Variant | Size | Weight | Line Height | Usage |
|---|---|---|---|---|
| `h1` | 2rem / 32px | 600 | 1.2 | Page headings |
| `h2` | 1.5rem / 24px | 600 | 1.3 | Section headings |
| `h3` | 1.25rem / 20px | 600 | 1.4 | Subsection headings |
| `h4` | 1.125rem / 18px | 600 | 1.4 | Card titles |
| `h5` | 1rem / 16px | 600 | 1.5 | Small headings |
| `h6` | 0.875rem / 14px | 600 | 1.5 | Micro labels |
| `body1` | 0.9375rem / 15px | 400 | 1.5 | Primary body |
| `body2` | 0.8125rem / 13px | 400 | 1.5 | Secondary text |
| `button` | 0.875rem / 14px | 500 | 1.0 | Buttons — no transform |
| `caption` | 0.75rem / 12px | 500 | 1.4 | Labels |
| `overline` | 0.6875rem / 11px | 600 | 1.4 | Section labels, uppercase |
| `hero` | clamp(2rem, 4vw, 3.5rem) | 700 | 1.1 | Dashboard KPIs only |

### Typography Rules

- All font sizes: `rem`, never `px` — honor browser zoom
- Fluid sizes: always `clamp()` for viewport adaptation
- `hero` variant: dashboard KPI metrics only — never as decorative type
- Headings: negative tracking `-0.02em` for tight, cohesive blocks
- Labels: uppercase with wide tracking `0.02em` for quiet context
- Line length: cap prose at `65ch`
- Minimum size in production UI: `caption` at 12px — never smaller
- Maximum distinct font weights on one screen: 2

---

## Spacing System

Base unit: **8px**. All spacing is a multiple of 8px.

| Token | CSS Variable | Pixels | Usage |
|---|---|---|---|
| 1× | `--mui-spacing-1` | 8px | Tight internal gaps |
| 2× | `--mui-spacing-2` | 16px | Standard padding |
| 3× | `--mui-spacing-3` | 24px | Internal component sections |
| 4× | `--mui-spacing-4` | 32px | Card padding |
| 5× | `--mui-spacing-5` | 40px | Page sections |
| 6× | `--mui-spacing-6` | 48px | Section dividers |
| 8× | `--mui-spacing-8` | 64px | Major layout gaps |
| 12× | `--mui-spacing-12` | 96px | Page-level separation |

### Border Radius

```
radius-sm:   4px   (badges, chips)
radius-md:   8px   (buttons, inputs — default)
radius-lg:   12px  (cards)
radius-xl:   16px  (panels, modals)
radius-2xl:  24px  (hero cards)
radius-full: 9999px (pills, avatars)
```

---

## Reference Aesthetics

When generating or evaluating UI, cite the reference — not vague ideals.

### Use These References

| Reference | What to Extract | When to Apply |
|---|---|---|
| **Apple** | Token discipline, invisible shadows, spacing as hierarchy | Anytime — gold standard for restraint |
| **Stripe** | Type scale discipline, controlled gradient, mature dark/light | Trust-heavy flows, financial data |
| **Porsche** | Massive whitespace, low noise density, hero calmness | Large screens, KPI dashboards |
| **Linear** | Tight 150–200ms micro-interactions, consistent cubic-bezier | Precision SaaS interactions |
| **Notion** | Mobile-first, comfortable desktop density, 4K scaling | Responsive layout decisions |
| **IBM** | Stable transitions, predictable timing, motion avoids attention theft | Enterprise data tables, admin views |
| **A24** | Long fades, mood-first transitions, sparse motion | Empty states, onboarding flows |

### Never Copy

- Dribbble-heavy parallax chaos
- 20+ animated elements on page load
- Neon accent spam in dark mode
- Purple gradients on white backgrounds
- Heavy drop shadows on every card
- Decorative animations that explain nothing

---

## Shadows & Elevation

```
shadow-xs:  0 1px 2px rgba(0,0,0,0.05)
shadow-sm:  0 1px 3px rgba(0,0,0,0.10), 0 1px 2px rgba(0,0,0,0.06)
shadow-md:  0 4px 6px rgba(0,0,0,0.07), 0 2px 4px rgba(0,0,0,0.06)
shadow-lg:  0 10px 15px rgba(0,0,0,0.10), 0 4px 6px rgba(0,0,0,0.05)
shadow-xl:  0 20px 25px rgba(0,0,0,0.10), 0 8px 10px rgba(0,0,0,0.04)
```

Dark mode: increase rgba alpha by 2–3×. Never flat in dark mode.

**Glassmorphism** (webapp contexts, with constraint):
- Background opacity: minimum `rgba(bg-paper-rgb, 0.7)` for text contrast
- Inset border: `1px solid rgba(255, 255, 255, 0.15)`
- Backdrop: `blur(20px) saturate(1.8)`

---

## Interaction States

| State | Light Mode | Dark Mode |
|---|---|---|
| Hover | `filter: brightness(0.95)` | `filter: brightness(1.1)` |
| Active | `transform: scale(0.98)` | same |
| Disabled | `opacity: 0.5; cursor: not-allowed` | same |
| Focus | `outline: 2px solid var(--mui-primary-main); outline-offset: 2px` | same |

Hover on cards/actionable elements: `transform: translateY(-2px)` + shadow increase. Never trigger layout shifts.

---

## Motion Governance

> Move less than you think. Animation is a structural amplifier, not decoration.

### Duration Tiers

| Type | Duration | Reference |
|---|---|---|
| Micro-interaction | 120–200ms | Linear |
| Navigation / panel | 200–300ms | IBM |
| Cinematic / reveal | 300–500ms | Porsche, A24 |

### Easing

```css
--ease-standard:   cubic-bezier(0.4, 0, 0.2, 1);   /* enterprise default */
--ease-decelerate: cubic-bezier(0, 0, 0.2, 1);      /* entrances */
--ease-accelerate: cubic-bezier(0.4, 0, 1, 1);      /* exits */
--ease-luxury:     cubic-bezier(0.25, 0.46, 0.45, 0.94); /* premium reveals */
```

### Transform Limits

```
scale:      ≤ 1.05
translateY: ≤ 16px
translateX: ≤ 24px
rotation:   ≤ 2deg (rare)
```

Max 5 animated elements per viewport. Max 3 simultaneous.

Always include:
```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## Surface & Elevation Logic

| Surface | Light | Dark | Note |
|---|---|---|---|
| Default BG | `#F5F5F7` | `#0e1015` | Page layer |
| Paper/Card | `#FFFFFF` | `#16181D` | Elevated surfaces |
| Panel/Modal | `#FFFFFF` | `#1E2028` | Highest elevation |
| AppBar | `#F5F5F7` | `#0e1015` | `border-bottom: 1px solid var(--mui-divider)` |
| Navigation | `#FFFFFF` | `#16181D` | `border-right: 1px solid var(--mui-divider)` |

Dark mode: always set `background-image: none` on Paper and AppBar.

---

## Premium Design Quality Checklist

### Before shipping any screen or component:

**Structure & Hierarchy**
- [ ] Purpose immediately clear — user understands within 2 seconds
- [ ] Most important info visually dominant
- [ ] Hierarchy via typography + spacing + contrast, not color alone

**Spacing & Alignment**
- [ ] All spacing follows 8px grid — zero exceptions
- [ ] Elements align to grid structure
- [ ] No visual tension from misalignment

**Typography**
- [ ] No more than 2 font weights per screen
- [ ] Headings and body clearly differentiated
- [ ] No dense text blocks without breathing room

**Color**
- [ ] Accent colors highlight key actions only
- [ ] Neutral colors dominate
- [ ] Light: no pure white dominant; Dark: no pure black
- [ ] Dark mode: no neon accent, controlled saturation

**Accessibility**
- [ ] Body text contrast ≥ 4.5:1
- [ ] All interactive elements keyboard-reachable
- [ ] Visible focus states on all elements
- [ ] Touch targets ≥ 44×44px

**Motion**
- [ ] No decorative animations
- [ ] Duration: 120–300ms range
- [ ] `prefers-reduced-motion` respected

**Polish**
- [ ] Nothing unnecessary present
- [ ] Small spacing differences resolved
- [ ] Corner radii consistent

> If a screen feels visually effortless, it has achieved the RITA quality standard.

---

## Applying These Guidelines

1. **Start with purpose** — What is this screen for? What's the primary task?
2. **Establish hierarchy** — What's most important? Make it dominant via size, weight, or position.
3. **Apply tokens** — Colors, spacing, and type from the tables above. Never hardcode.
4. **Respect whitespace** — More space almost always improves quality.
5. **Validate against references** — Porsche spacing, Stripe type, Linear motion.
6. **Check the checklist** — Accessibility, motion, typography rules.

---

For complete design system: `design.md` · `docs/design/` · `docs/rules/` · `docs/references/`
