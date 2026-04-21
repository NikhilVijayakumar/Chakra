# Phase 08 Research: Prana Dependency Capability + Drive Policy Integration

## Scope
Phase 8 integrates upstream Prana fixes into Chakra without regressing phase-7 startup/auth behavior:
- consume reusable host dependency capability checks (SSH, Git, virtual-drive binary),
- keep dependency checks page-agnostic (not splash-owned),
- adopt client-owned virtual drive policy while preserving runtime mount/unmount mechanics,
- enforce drive lifecycle (mount on app start, eject on app stop).

## Codebase Findings

### Upstream Prana already implements the requested capability service
- `E:/Python/prana/src/main/services/hostDependencyCapabilityService.ts` exists and implements a shared contract:
  - `passed: boolean`
  - `missing: ('ssh' | 'git' | 'virtual-drive')[]`
  - `diagnostics[]` with source (`PATH` or `CONFIG`), command, and message.
- Virtual-drive binary resolution already supports configured binary path fallback (`sqliteConfigStoreService`) before PATH lookup (`rclone version`).

### Upstream startup orchestration already wires host dependency checks as a blocking stage
- `E:/Python/prana/src/main/services/startupOrchestratorService.ts` includes stage id `host-dependencies` and integrates `hostDependencyCapabilityService.evaluate()` before governance.
- `E:/Python/prana/src/main/services/startupOrchestratorService.test.ts` verifies:
  - startup blocks when required host dependency is missing,
  - dependency stage is skipped if integration pre-check fails,
  - client-managed policy can skip runtime storage bootstrap stages.

### Upstream drive architecture now supports client-owned policy
- `E:/Python/prana/src/main/services/driveControllerService.ts` exposes policy snapshot with `clientManaged` and uses policy to alter runtime stage behavior.
- `E:/Python/prana/docs/features/storage/virtual-drive.md` documents host/client policy split:
  - Prana owns mount mechanics and diagnostics,
  - host app owns drive schema/content/encryption policy,
  - startup mirror-validation can be skipped in client-managed policy mode.

### Chakra current state and integration anchors
- Main startup currently validates config and defers SSH verification to splash (`src/main/services/startupSecurity.ts`, `src/main/index.ts`).
- Splash view model still owns staged SSH/runtime/vault/gateway sequence (`src/renderer/src/features/splash-override/viewmodel/useDhiSplashViewModel.ts`).
- Preload API currently exposes startup/auth contracts but no explicit host-dependency capability API surface in Chakra (`src/preload/index.ts`, `src/preload/index.d.ts`).

## Constraints and Risks
- Avoid duplicating dependency checks in Chakra splash logic; doing so would violate page-agnostic requirement and create drift from Prana core contract.
- Preserve phase-7 route contract (`/splash` -> `/login` or `/apps`) while enriching startup capability checks.
- Ensure legacy permissive `dharma` typing in preload declarations remains untouched unless explicitly in phase scope.
- Mount/eject lifecycle must be deterministic and not break current startup when dependency checks fail.

## Recommended Implementation Strategy
1. Introduce a Chakra-side adapter over Prana host dependency capability contract (main service boundary), not splash-owned logic.
2. Expose dependency capability status via preload API so multiple renderer surfaces can consume it (splash now, diagnostics/settings later).
3. Refactor splash flow to consume shared capability results rather than directly owning dependency probing semantics.
4. Adopt/confirm client-managed drive policy inputs in Chakra runtime config passed into Prana, ensuring startup mount and shutdown eject hooks are explicit.
5. Add regression coverage for:
   - missing dependency blocks with dependency-specific diagnostics,
   - successful dependency checks do not regress current splash/login/apps flow,
   - client-managed drive policy path and lifecycle behavior.

## Validation Architecture
- Fast checks (after each task):
  - `npm run typecheck`
  - targeted vitest files for startup + splash + preload contract
- Full checks (after each plan wave):
  - `npm run build`
  - targeted runtime test packs touching startup orchestration and route contracts
- Required assertions:
  - host dependency stage is reusable and not hardwired to splash ownership,
  - missing `ssh`/`git`/`virtual-drive` yields structured diagnostic output,
  - app-start mount and app-stop eject lifecycle behavior is observable and deterministic.

## Canonical References
- `.planning/phases/08-prana-has-fixed-the-pr-we-raised-docs-pr-prana-so-now-we-nee/08-CONTEXT.md`
- `.planning/ROADMAP.md`
- `.planning/REQUIREMENTS.md`
- `docs/pr/prana/splash-dependency-precheck-proposal.md`
- `docs/pr/prana/drive-decoupling-client-owned-policy-proposal.md`
- `src/main/index.ts`
- `src/main/services/startupSecurity.ts`
- `src/renderer/src/features/splash-override/viewmodel/useDhiSplashViewModel.ts`
- `src/preload/index.ts`
- `src/preload/index.d.ts`
- `E:/Python/prana/src/main/services/hostDependencyCapabilityService.ts`
- `E:/Python/prana/src/main/services/startupOrchestratorService.ts`
- `E:/Python/prana/src/main/services/startupOrchestratorService.test.ts`
- `E:/Python/prana/src/main/services/driveControllerService.ts`
- `E:/Python/prana/src/main/services/virtualDriveProvider.ts`
- `E:/Python/prana/docs/features/boot/startup-orchestrator.md`
- `E:/Python/prana/docs/features/storage/virtual-drive.md`
- `E:/Python/prana/docs/pr/chakra/splash-dependency-precheck-proposal.md`
- `E:/Python/prana/docs/pr/chakra/drive-decoupling-client-owned-policy-proposal.md`
