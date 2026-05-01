# Boot Feature

Platform initialization and validation sequence.

## Structure

```
boot-feature/
├── view/
│   ├── BootContainer.tsx      # Navigation + session management
│   └── BootView.tsx           # UI presentation
└── viewmodel/
    └── useBootViewModel.ts    # Validation logic
```

## Components

### BootContainer
- Manages navigation after boot completes
- Handles SSH/dependency failures
- Preserves session management logic

### BootView
- Presents the boot sequence UI
- Shows animated header + status indicators
- Displays real-time validation progress

### useBootViewModel
- Migrated validation logic from useDhiSplashViewModel
- Runs 5-stage boot sequence:
  1. Platform Runtime Configuration
  2. Employee Directory Sync (Google Sheets)
  3. SSH Credential Verification
  4. Vault Initialization
  5. AI Model Gateway Probe

## Reusable Components (boot-astra)

Located in `src/renderer/src/common/components/boot-astra/`:

- **BootAnimatedHeader** - Animated title with cascading letters
- **BootStageCard** - Individual validation stage display
- **BootSequenceIndicator** - Complete sequence timeline

These can be migrated to Astra library for use in other applications.

## Theme Integration

Uses Astra MUI 7 theme with:
- Dark/light mode support
- Primary, success, error color palette
- Framer Motion for animations
- Responsive design

## Usage

```tsx
import { BootContainer } from '@renderer/features/boot-feature'

// In your routing:
<Route path="/boot" element={<BootContainer />} />
```

## Validation Stages

Each stage can result in:
- **success** - Validation passed
- **error** - Fatal error, requires retry
- **skipped** - Non-critical failure, using fallback
- **loading** - Currently running
- **pending** - Not yet started

Errors are actionable with a retry button.
Skipped stages allow app to continue with degraded functionality.
