# Boot Feature Migration — Chakra Platform

## Summary

Successfully migrated the boot/splash feature from basic implementation to a modern, theme-aware component using Astra (MUI 7) while preserving all validation logic.

## What Was Changed

### 1. Created New Boot Feature (`src/renderer/src/features/boot-feature/`)

**BootContainer.tsx**
- Manages navigation after boot completion
- Preserves session management logic
- Routes to `/login` (no session) or `/apps` (with session)
- Handles SSH/dependency failures → `/access-denied`

**BootView.tsx**
- New UI using Astra MUI 7 theme
- Displays animated header + status timeline
- Supports dark/light mode automatically
- Responsive design with centered layout

**useBootViewModel.ts**
- Migrated validation logic from `useDhiSplashViewModel`
- 5-stage boot sequence:
  1. Platform Runtime Configuration
  2. Syncing Employee Directory (Google Sheets)
  3. Governance Repository Verification (SSH)
  4. Mounting Local Encrypted Vault
  5. Probing Local AI Model Gateway
- Preserves all error handling and retry logic

### 2. Created Reusable Components (`src/renderer/src/common/components/boot-astra/`)

These components follow Astra's atomic design and can be migrated to the Astra library for use in other applications.

**BootAnimatedHeader.tsx**
- Animated letter cascade (inspired by mockup design)
- Kinetic minimalism with spring transitions
- Hover effects with color change to primary
- Optional animation disable for performance

**BootStageCard.tsx**
- Displays individual validation stage
- Status indicators: pending/loading/success/error/skipped
- Vertical timeline connector
- Error/detail message display
- Animated entrance

**BootSequenceIndicator.tsx**
- Combines multiple BootStageCard instances
- Complete timeline visualization
- Retry button for fatal errors
- Responsive max-width 480px

### 3. Updated Routing

**main.tsx**
- Route `/splash` → BootContainer (new)
- Route `/boot` → BootContainer (alias)
- Old splash implementation preserved for backward compatibility

**package.json**
- Added `framer-motion@^11.18.2` for animations

## Design Features

### Mockup Alignment
- Kinetic minimalism animations ✅
- Letter cascade on title ✅
- Timeline progress indicator ✅
- Status icons with colors ✅
- Real-time validation feedback ✅
- Error handling with retry ✅

### Astra Theme Integration
- **Colors**: Uses MUI theme palette (primary, success, error, warning)
- **Spacing**: Material Design standard spacing
- **Typography**: MUI typography variants
- **Animations**: Framer Motion with spring easing
- **Dark/Light Mode**: Automatically inherited from theme

## Component Hierarchy

```
BootContainer (Feature)
├── BootView (Presentation)
│   ├── BootAnimatedHeader (Component)
│   └── BootSequenceIndicator (Organism)
│       └── BootStageCard × 5 (Molecules)
└── useBootViewModel (Logic)
```

## Validation Stages

| Stage | Purpose | Success | Failure | Skipped |
|-------|---------|---------|---------|---------|
| Runtime | Bootstrap + drive layout | ✓ proceed | Fatal error | Browser mode |
| Sheets | Employee directory sync | ✓ proceed | Use cache | No Google auth |
| SSH | Repository verification | ✓ proceed | Access denied | Browser mode |
| Vault | Vault initialization | ✓ proceed | (N/A) | (N/A) |
| Gateway | AI model availability | ✓ proceed | Proceed anyway | Browser mode |

## Configuration

### Theme Colors (MUI)
```typescript
const theme = useTheme()
theme.palette.primary.main      // Primary blue (#5A60F5)
theme.palette.success.main      // Success green
theme.palette.error.main        // Error red
theme.palette.warning.main      // Warning yellow
theme.palette.text.primary      // Main text
theme.palette.background.default // Page background
```

### Animation Timing
- Letter cascade: 150ms stagger, 200ms delay
- Entry: 400ms duration
- Fade-in: 300-400ms with expo easing

## How to Use

### Basic Integration
```tsx
import { BootContainer } from '@renderer/features/boot-feature'

// In routing:
<Route path="/splash" element={<BootContainer />} />
```

### Standalone Usage
```tsx
import { BootView } from '@renderer/features/boot-feature/view/BootView'
import { useBootViewModel } from '@renderer/features/boot-feature/viewmodel/useBootViewModel'

const MyComponent = () => {
  const { stages, handleRetry, isFatalActionableError } = useBootViewModel(
    () => console.log('Complete'),
    () => console.log('SSH failure')
  )
  
  return (
    <BootView
      stages={stages}
      onRetry={handleRetry}
      canRetry={isFatalActionableError}
      currentStepIndex={0}
    />
  )
}
```

### Reusable Components (for Astra)
```tsx
import {
  BootAnimatedHeader,
  BootSequenceIndicator,
  BootStageCard
} from '@renderer/common/components/boot-astra'

// Use in other features
<BootAnimatedHeader title="MY APP" subtitle="Loading" />
<BootSequenceIndicator stages={stages} />
```

## Testing

### Manual Testing Checklist
- [ ] Boot sequence completes on app start
- [ ] Dark mode styling displays correctly
- [ ] Light mode toggle works
- [ ] All 5 stages progress in order
- [ ] Error stage shows retry button
- [ ] SSH failure navigates to `/access-denied`
- [ ] Success navigates to `/login` or `/apps`
- [ ] Responsive on mobile (< 480px)
- [ ] Animations smooth (60fps)

### Browser vs Electron
- **Browser**: Stages 0, 1, 2, 4 show "skipped"
- **Electron**: All stages run with real validations
- **Graceful degradation**: Skipped stages allow continuation

## Future Migration to Astra

The boot-astra components are designed for migration to the Astra library:

1. Export from `astra/components/organisms/BootSequenceIndicator`
2. Export from `astra/components/molecules/BootStageCard`
3. Export from `astra/components/atoms/BootAnimatedHeader`
4. Update Chakra to import from Astra
5. Use in other applications (Rita, future apps)

## File Structure

```
src/renderer/src/
├── features/boot-feature/
│   ├── view/
│   │   ├── BootContainer.tsx          # Navigation logic
│   │   └── BootView.tsx               # UI presentation
│   ├── viewmodel/
│   │   └── useBootViewModel.ts        # Validation logic
│   └── README.md                      # Feature docs
├── common/components/
│   └── boot-astra/
│       ├── BootAnimatedHeader.tsx     # Animated title
│       ├── BootStageCard.tsx          # Stage display
│       ├── BootSequenceIndicator.tsx  # Timeline
│       └── index.ts                   # Exports
└── main.tsx                           # Updated routing
```

## Dependencies Added
- `framer-motion@^11.18.2` - For smooth animations

## Notes

### Why Preserve useDhiSplashViewModel?
- Other features may still depend on it
- Gradual deprecation is safer
- Can coexist with new boot feature

### Animation Performance
- Uses `will-change` internally via Framer Motion
- Spring easing for natural motion
- Respects `prefers-reduced-motion` for accessibility

### Error Handling
- Fatal errors show retry button
- Skipped stages allow app to continue
- All errors logged to console
- User-friendly error messages

### Session Management
- Preserves existing `volatileSessionStore` logic
- Stateless boot sequence
- Session checked only at completion

## Success Criteria ✅

- [x] Boot validation logic preserved
- [x] New Astra MUI 7 theme applied
- [x] Animations from mockup implemented
- [x] Reusable components created
- [x] Routing updated
- [x] No breaking changes to existing code
- [x] Graceful fallback for browser mode
- [x] Dark/light mode support
- [x] Mobile responsive
- [x] Ready for Astra migration

## Next Steps

1. **Test boot flow** - Verify all validation stages
2. **Test error handling** - Trigger SSH failure, etc.
3. **Visual QA** - Compare with mockup design
4. **Performance testing** - Monitor animation frame rate
5. **Accessibility audit** - Keyboard navigation, reduced motion
6. **Prepare Astra migration** - Extract components for library

---

**Created**: May 1, 2026  
**Feature**: Boot/Splash Screen Migration  
**Status**: Implementation Complete, Ready for Testing
