---
phase: 10
slug: virtual-drive-directory-layout-defined-by-json-config-with-a
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-22
---

# Phase 10 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest (check package.json scripts — Wave 0 gap if missing) |
| **Config file** | vitest.config.ts or check package.json `scripts.test` |
| **Quick run command** | `npm run test -- --testPathPattern driveLayout` |
| **Full suite command** | `npm run test` |
| **Estimated runtime** | ~5 seconds |

> Wave 0 task: check `package.json` test scripts before writing tests. If no test framework is configured, note it and skip test tasks.

---

## Sampling Rate

- **After every task commit:** Run quick path pattern test for driveLayoutService
- **After every plan wave:** Run full suite
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** ~5 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 10-01-01 | 01 | 1 | D-04 | — | N/A — no user input | unit | `npm test -- driveLayout` | ✅ | ⬜ pending |
| 10-01-02 | 01 | 1 | D-03 | — | N/A | unit | `npm test -- driveLayout` | ✅ | ⬜ pending |
| 10-01-03 | 01 | 2 | D-09 | — | N/A | manual smoke | App start → check `S:\apps\chakra` exists | N/A | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] Confirm test framework in `package.json` (`scripts.test`)
- [ ] If test framework exists: create `src/main/services/driveLayoutService.test.ts` with stubs for `flattenDirectoryTree` and `loadLayout`
- [ ] If no framework: note gap and skip test tasks; rely on manual smoke test

*Note: `driveLayoutService.ts` has no existing test file — unit tests are new.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| `hookSystemService` fires and `ensureDirectories` runs after drive mount | D-09 | Requires virtual drive mount (rclone/WinFsp); not automatable in unit tests | Start app in dev mode, check console for `[Chakra] Drive layout verified: 7 directories ensured` log |
| Directories exist on mounted drive | D-04 | Requires physical drive letter (e.g. `S:`) | After app start, check `S:\apps\chakra`, `S:\apps\dhi`, `S:\cache\sqlite`, `S:\data\governance` exist |
| Fallback path also gets directories | D-03 | Requires drive disabled (`VIRTUAL_DRIVE_ENABLED=false`) | Start with drive disabled; check fallback path gets same dirs |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 10s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
