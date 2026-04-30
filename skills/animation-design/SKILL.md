---
name: animation-design
description: Create best-in-class animations using intent-aligned motion systems. Use this skill when adding motion, animations, transitions, or micro-interactions to any frontend code. Follows animation governance from docs/references/animations.md with timing, easing, and transforms aligned to emotional intent (calm, trust, premium, playful). References Linear, Stripe, Apple, Figma, IBM, Porsche for premium motion.
license: Complete terms in LICENSE.txt
---

# Animation Design

Create best-in-class animations using intent-aligned motion systems. Aligns with `docs/references/animations.md` and `docs/rules/Core Design Rules.md`.

**Core Principle:** Animation is not decoration — it is a structural amplifier.

## Design Philosophy

| Principle | Description |
|---|---|
| **Precision** | Timing is intentional, not arbitrary |
| **Clarity** | Motion supports understanding |
| **Restraint** | Move less than you think — premium rarely exceeds limits |

## Animation Reference Matrix

### By Emotion Profile

| Emotion | Motion Style | Duration | Reference |
|---|---|---|---|
| Calm | Fade + minimal translate | 300-500ms | A24 |
| Trust | Subtle + predictable | 200-250ms | IBM, Stripe |
| Premium | Slow + spacious | 300-500ms | Porsche |
| Energetic | Faster + higher contrast | 150-250ms | Apple |
| Playful | Spring + micro bounce | 120-200ms | Figma |
| Precision SaaS | Tight + consistent | 150-200ms | Linear |

## Deterministic Animation Rules (from docs/references/animations.md)

### 1. Duration Discipline

| Type | Range |
|---|---|
| Micro-interaction | 120-200ms |
| Navigation | 200-300ms |
| Cinematic reveal | 300-500ms |

### 2. Motion Frequency Limit

```
animated_elements_per_viewport <= 5
```

### 3. Transform Boundaries

```css
scale <= 1.05
translateY <= 16px
rotation <= 2deg (rarely used)
```

### 4. Easing Consistency

Single easing family per emotion profile:
- Calm → `ease-in-out`
- Playful → spring physics
- Enterprise → `cubic-bezier(.4, 0, .2, 1)`

## Premium Motion References

### Linear — Precision & Polish
- 150-200ms durations
- Consistent easing
- Minimal transform distance
- No exaggerated scale
- **Ideal for:** Premium SaaS, calm emotion profiles

### Stripe — System Feedback
- Fade + slight translate combo
- Controlled opacity transitions
- No aggressive spinners
- **Ideal for:** Checkout flows, loading states

### Apple — Scroll-Driven
- Section-by-section reveal pacing
- Controlled parallax depth
- Progressive disclosure
- **Ideal for:** Storytelling, product pages

### Figma — Playful
- Micro bounce
- Spring physics
- Small scale (<1.05)
- **Ideal for:** Creative tools, playful brands

### IBM — Enterprise
- 200-250ms fades
- Slide under 8px
- No elastic bounce
- **Ideal for:** Enterprise dashboards

### Porsche — Luxury
- 300-500ms fades
- Subtle scaling (1.02 max)
- Delayed reveal sequencing
- **Ideal for:** Premium brands

## Implementation Patterns

### CSS-Only Micro-Interactions

```css
/* Button hover — Light mode */
.btn:hover {
  filter: brightness(0.95);
  transition: filter 150ms cubic-bezier(0.4, 0, 0.2, 1);
}

/* Button hover — Dark mode */
[data-theme="dark"] .btn:hover {
  filter: brightness(1.1);
  transition: filter 150ms cubic-bezier(0.4, 0, 0.2, 1);
}

/* Active/Pressed */
.btn:active {
  transform: scale(0.98);
  transition: transform 100ms ease-out;
}

/* Focus ring */
.btn:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}
```

### Page Load Reveal

```css
/* Staggered reveal */
.fade-in {
  opacity: 0;
  animation: fadeIn 300ms ease-out forwards;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}

/* Delay sequence */
.fade-in:nth-child(1) { animation-delay: 0ms; }
.fade-in:nth-child(2) { animation-delay: 50ms; }
.fade-in:nth-child(3) { animation-delay: 100ms; }
.fade-in:nth-child(4) { animation-delay: 150ms; }
.fade-in:nth-child(5) { animation-delay: 200ms; }
```

### Loading States

```css
/* Skeleton pulse */
.skeleton {
  background: linear-gradient(
    90deg,
    var(--color-surface-1) 0%,
    var(--color-surface-2) 50%,
    var(--color-surface-1) 100%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}

@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
```

### Modal/Dialog

```css
.modal-backdrop {
  animation: fadeIn 200ms ease-out;
}

.modal-content {
  animation: slideUp 250ms cubic-bezier(0.4, 0, 0.2, 1);
}

@keyframes slideUp {
  from { opacity: 0; transform: translateY(16px) scale(0.98); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}
```

### Sidebar Navigation

```css
.sidebar-item {
  transition: background-color 150ms ease, transform 100ms ease;
}

.sidebar-item:hover {
  background-color: var(--color-surface-2);
}

.sidebar-item:active {
  transform: scale(0.98);
}
```

## Reduced Motion Support (Accessibility)

**ALWAYS include:** Respect `prefers-reduced-motion`

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

## What to AVOID

- Dribbble-heavy parallax chaos
- 20 animated elements on load
- Auto-playing everything
- High-frequency bouncing
- Random durations exceeding 500ms
- Scale > 1.05
- Translate > 16px
- Pure black (#000) backgrounds with neon accents

## Animation Governance Checklist

Before shipping any animation:

- [ ] Duration fits type (120-500ms max)
- [ ] Elements per viewport <= 5
- [ ] Easing consistent with emotion profile
- [ ] Transform within bounds
- [ ] Reduced motion supported
- [ ] No autoplay without user consent
- [ ] Dark mode tested
- [ ] Performance: 60fps target

## Performance in Electron

Animations in Electron/Chromium:
- Heavy animations = real CPU hit
- Use `transform` and `opacity` only
- Avoid layout-triggering properties
- Test on lower-end hardware

---
For complete reference, see: `docs/references/animations.md`, `docs/references/lottie.md`, `docs/rules/Core Design Rules.md`