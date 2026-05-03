# Feature: Splash and Boot Sequence

## Overview

The application entry point is divided into two distinct sequential phases:
1. **Hero Splash Screen** (BAVANS Identity)
2. **Boot Initialization Screen** (CHAKRA Platform)

Both phases embrace the "Kinetic Minimalism" design philosophy, leveraging carefully choreographed animations and "Anthropic-grade" physics to provide a premium, dynamic feel before the user lands on the authentication or home screen.

## Phase 1: Hero Splash Screen (BAVANS)

### What It Does
The splash screen serves as a high-fidelity visual identifier that introduces the core values and heritage of the BAVANS ecosystem.

- **Mockup Reference:** `docs/mockup/index.html`
- **Implementation:** `src/renderer/src/features/splash-override/view/SplashContainerOverride.tsx`

### Architecture & Implementation Details
- **Component Structure:**
  - `SplashContainerOverride`: The state orchestrator controlling the timing of animations and route transitions.
  - `SplashHeroStage`: The visual container that manages the theme mode, radial gradient background, and layout.
  - `HeroLetter`: Represents an individual letter in the BAVANS acronym along with top/bottom tooltips.
- **Choreography:**
  - Displays the BAVANS acronym sequentially: **B**havana (Belief), **A**advika (Art), **V**ijayakumar (Vision), **A**arradhya (Aesthetic), **N**ikhil (Narrative), **S**wathy (Story).
  - Uses `setTimeout`-driven loops to iterate through a `hoveredIndex`, simulating an automated hover state (scale-up, color transition, tooltip reveal) across the letters.
  - Honors `prefers-reduced-motion` using `window.matchMedia` to either shorten the timeout duration (350ms vs 1000ms) or suppress elaborate transitions.
- **Routing:** 
  - After completing the sequential animation, it triggers a `navigate('/boot', { replace: true })` to transition into the Boot Sequence.

## Phase 2: Boot Initialization (CHAKRA)

### What It Does
The boot screen provides a visually engaging, technical representation of the platform's initialization lifecycle. It reassures the user that underlying subsystems (validation, storage, network) are booting up securely.

- **Mockup Reference:** `docs/mockup/boot.html`
- **Implementation:** 
  - `src/renderer/src/features/boot-feature/view/BootView.tsx`
  - `src/renderer/src/common/components/boot-astra/BootAnimatedHeader.tsx`
  - `src/renderer/src/common/components/boot-astra/BootSequenceIndicator.tsx`

### Architecture & Implementation Details
- **Component Structure:**
  - `BootView`: The container that assembles the animated header and the sequence indicator array.
  - `BootAnimatedHeader`: Uses `framer-motion` to render a cascading, staggered entry of the letters "C-H-A-K-R-A" with a spring physics configuration.
  - `BootSequenceIndicator`: Receives a list of `stages` (e.g., Platform Runtime Configuration, Governance Verification, Mounting Vault) and visually represents their progress (Pending, Loading, Success, Failed) mimicking a technical boot log.
- **State Management:**
  - The boot state (`stages`, `onRetry`, `canRetry`) is typically supplied by a ViewModel (`useBootViewModel.ts`) linking the UI to the actual IPC calls and backend readiness checks.
- **Framer Motion Integration:** 
  - Replaces the pure CSS keyframes used in the mockup with `framer-motion` to offer richer stagger controls and React-friendly lifecycle synchronization.

## Security & Performance Considerations

- **Non-blocking Operations:** The Splash screen acts purely as a UI overlay while the main process is doing the actual early system bootstrap (Nyquist Validation, Startup Security).
- **Graceful Degradation:** Both features utilize `prefers-reduced-motion` fallbacks to ensure accessibility is maintained without sacrificing core functionality.
- **Theme Coupling:** Uses `setDocumentTheme` via `[data-theme]` attributes to enforce consistency between the document-level DOM and MUI/Emotion theme boundaries early in the component lifecycle.
