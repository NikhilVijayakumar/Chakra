# Prana Bug Report: Windows EPERM on mkdir at WinFsp drive root

## Summary
On Windows, after the system virtual drive mounts successfully at a drive letter (e.g. `S:`), downstream services crash with `EPERM: operation not permitted, mkdir 'S:\'` because `updateSystemDataRoot()` sets the app data root to the raw drive letter. When services call `mkdir(getAppDataRoot(), { recursive: true })`, it attempts to create the drive root itself — which WinFsp does not permit.

## Environment
- Host app: Chakra
- OS: Windows 11
- Runtime: Electron dev (`npm run dev`)
- Virtual drive provider: rclone + WinFsp
- rclone: v1.73.5 (cmount build)
- WinFsp: v2.1.25156

## Root Cause
In `driveControllerService.ts`, `updateSystemDataRoot()` uses different root paths per platform:

```typescript
// Line 272 (before fix)
const mountedRoot = isWindows() ? record.mountPoint : join(record.mountPoint, 'live');
```

On Linux, the app data root becomes `/mount/system/live` (a subdirectory that can be created).  
On Windows, it becomes `S:` → `S:\` — the drive root, which cannot be `mkdir`'d on a WinFsp mount.

## Observed Error
```
Error occurred in handler for 'auth:get-status': [Error: EPERM: operation not permitted, mkdir 'S:\']
```
This repeats for any service calling `mkdir(getAppDataRoot(), { recursive: true })`.

## Fix Applied

### 1. `updateSystemDataRoot()` — use `live` subdirectory on all platforms

```diff
-    const mountedRoot = isWindows() ? record.mountPoint : join(record.mountPoint, 'live');
+    const mountedRoot = join(record.mountPoint, 'live');
```

### 2. Readiness probe — check mount point, then create subdirectory

```diff
     if (isWindows()) {
       try {
-        await access(mountedRoot);
+        await access(record.mountPoint);
       } catch {
         ...
       }
-    } else {
-      await mkdir(mountedRoot, { recursive: true });
     }
+
+    await mkdir(mountedRoot, { recursive: true });
```

### 3. `getSystemDataRoot()` — consistent with `updateSystemDataRoot()`

```diff
-      return isWindows() ? system.mountPoint : join(system.mountPoint, 'live');
+      return join(system.mountPoint, 'live');
```

## Why This Works
- `S:\live` can be created inside a WinFsp mount (it's a regular directory)
- `S:\` cannot be created (it's the virtual filesystem root itself)
- Linux already used `join(mountPoint, 'live')` — this just makes Windows consistent

## Files Changed
- `src/main/services/driveControllerService.ts` — lines 272, 274-289, 659
