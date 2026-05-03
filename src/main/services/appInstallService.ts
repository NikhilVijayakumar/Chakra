import { spawn } from 'node:child_process'
import { existsSync, rmSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { eq, and } from 'drizzle-orm'
import { getDb } from '../db/init'
import { apps, appUsers, appTeams, employeeTeams, employees, installedApps, teams } from '../db/schema'
import type {
  AppRow,
  AppUserRow,
  AppTeamRow,
  TeamRow,
  EmployeeTeamRow
} from './googleSheetsService'

// ── Directory helpers ─────────────────────────────────────────────────────────

const getAppsBaseDir = async (): Promise<string> => {
  try {
    const { driveControllerService } = await import('prana/main/services/driveControllerService')
    const driveRoot = driveControllerService.getSystemDataRoot()
    if (driveRoot) {
      return join(driveRoot, 'apps')
    }
  } catch {
    // virtual drive not available — fall through to local fallback
  }
  const localAppData =
    process.env.LOCALAPPDATA ||
    process.env.APPDATA ||
    join(process.env.USERPROFILE ?? process.env.HOME ?? '', 'AppData', 'Local')
  return join(localAppData, 'BavansApps', 'apps')
}

// ── DB helpers ────────────────────────────────────────────────────────────────

export const saveApps = async (rows: AppRow[]): Promise<void> => {
  const db = getDb()
  const now = Math.floor(Date.now() / 1000)
  db.delete(apps).run()
  if (rows.length === 0) return
  db.insert(apps)
    .values(
      rows.map(r => ({
        id: r.app_id,
        name: r.name,
        cloneUrl: r.clone_url,
        commitHash: r.commit_hash,
        status: r.status,
        sync: now,
        isDirty: false,
        isDeleted: false
      }))
    )
    .run()
  console.info(`[Chakra] App store: ${rows.length} apps saved`)
}

export const saveAppUsers = async (rows: AppUserRow[]): Promise<void> => {
  const db = getDb()
  const now = Math.floor(Date.now() / 1000)
  db.delete(appUsers).run()
  if (rows.length === 0) return
  db.insert(appUsers)
    .values(
      rows.map(r => ({
        employeeId: r.employee_id,
        appId: r.app_id,
        status: r.status,
        sync: now,
        isDirty: false,
        isDeleted: false
      }))
    )
    .run()
  console.info(`[Chakra] App store: ${rows.length} app-user records saved`)
}

export const saveAppTeams = async (rows: AppTeamRow[]): Promise<void> => {
  const db = getDb()
  const now = Math.floor(Date.now() / 1000)
  db.delete(appTeams).run()
  if (rows.length === 0) return
  db.insert(appTeams)
    .values(
      rows.map(r => ({
        appId: r.app_id,
        teamId: r.team_id,
        status: r.status,
        sync: now,
        isDirty: false,
        isDeleted: false
      }))
    )
    .run()
  console.info(`[Chakra] App store: ${rows.length} app-team records saved`)
}

export const saveTeams = async (rows: TeamRow[]): Promise<void> => {
  const db = getDb()
  const now = Math.floor(Date.now() / 1000)
  db.delete(teams).run()
  if (rows.length === 0) return
  db.insert(teams)
    .values(
      rows.map(r => ({
        id: r.team_id,
        name: r.team_name,
        status: r.status,
        sync: now,
        isDirty: false,
        isDeleted: false
      }))
    )
    .run()
  console.info(`[Chakra] App store: ${rows.length} teams saved`)
}

export const saveEmployeeTeams = async (rows: EmployeeTeamRow[]): Promise<void> => {
  const db = getDb()
  const now = Math.floor(Date.now() / 1000)
  db.delete(employeeTeams).run()
  if (rows.length === 0) return
  db.insert(employeeTeams)
    .values(
      rows.map(r => ({
        employeeId: r.employee_id,
        teamId: r.team_id,
        status: r.status,
        sync: now,
        isDirty: false,
        isDeleted: false
      }))
    )
    .run()
  console.info(`[Chakra] App store: ${rows.length} employee-team records saved`)
}

// ── Access logic ──────────────────────────────────────────────────────────────

export interface AppWithAccess {
  id: string
  name: string
  cloneUrl: string
  commitHash: string | null
  status: string
  isInstalled: boolean
  installPath: string | null
  installedAt: number | null
  version: string | null
}

const getInstalledRecord = (appId: string): { installPath: string | null; installedAt: number | null } => {
  const db = getDb()
  const rec = db.select().from(installedApps).where(eq(installedApps.appId, appId)).get()
  return { installPath: rec?.installPath ?? null, installedAt: rec?.installedAt ?? null }
}

const readAppVersion = (installPath: string): string | null => {
  try {
    const pkgPath = join(installPath, 'package.json')
    if (!existsSync(pkgPath)) return null
    const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'))
    return pkg.version ?? null
  } catch {
    return null
  }
}

export const getEmployeeIdByEmail = (email: string): string | null => {
  const db = getDb()
  const emp = db
    .select({ id: employees.id })
    .from(employees)
    .where(eq(employees.email, email.trim().toLowerCase()))
    .get()
  return emp?.id ?? null
}

export const getUserAccessibleApps = (employeeId: string): AppWithAccess[] => {
  const db = getDb()

  // All apps accessible to this employee:
  // 1. Direct grant: app_users.status = 'active' for this employee
  // 2. Team grant: app_teams has a team the employee belongs to, with status = 'active',
  //    unless overridden by an explicit app_users row with status = 'inactive'

  const allApps = db.select().from(apps).where(eq(apps.isDeleted, false)).all()

  const directGrants = new Set(
    db
      .select({ appId: appUsers.appId })
      .from(appUsers)
      .where(and(eq(appUsers.employeeId, employeeId), eq(appUsers.status, 'active')))
      .all()
      .map(r => r.appId!)
  )

  const explicitBlocks = new Set(
    db
      .select({ appId: appUsers.appId })
      .from(appUsers)
      .where(and(eq(appUsers.employeeId, employeeId), eq(appUsers.status, 'inactive')))
      .all()
      .map(r => r.appId!)
  )

  // Teams this employee belongs to (active membership)
  const myTeamIds = new Set(
    db
      .select({ teamId: employeeTeams.teamId })
      .from(employeeTeams)
      .where(and(eq(employeeTeams.employeeId, employeeId), eq(employeeTeams.status, 'active')))
      .all()
      .map(r => r.teamId!)
  )

  // App IDs accessible via team
  const teamGrantedAppIds = new Set(
    db
      .select({ appId: appTeams.appId })
      .from(appTeams)
      .where(eq(appTeams.status, 'active'))
      .all()
      .filter(r => myTeamIds.has(r.teamId!))
      .map(r => r.appId!)
  )

  const accessible = allApps.filter(a => {
    if (!a.id) return false
    if (directGrants.has(a.id)) return true
    if (explicitBlocks.has(a.id)) return false
    if (teamGrantedAppIds.has(a.id)) return true
    return false
  })

  return accessible.map(a => {
    const { installPath, installedAt } = getInstalledRecord(a.id!)
    const actuallyInstalled = installPath ? existsSync(installPath) : false
    const version = actuallyInstalled && installPath ? readAppVersion(installPath) : null
    return {
      id: a.id!,
      name: a.name ?? a.id!,
      cloneUrl: a.cloneUrl ?? '',
      commitHash: a.commitHash && a.commitHash.trim() ? a.commitHash.trim() : null,
      status: a.status ?? 'active',
      isInstalled: actuallyInstalled,
      installPath: actuallyInstalled ? installPath : null,
      installedAt: actuallyInstalled ? installedAt : null,
      version
    }
  })
}

// ── Shell helpers ─────────────────────────────────────────────────────────────

export type InstallProgressCallback = (step: string, percent: number, log: string) => void

const runCommand = (
  cmd: string,
  args: string[],
  cwd?: string,
  onLog?: (line: string) => void
): Promise<void> => {
  return new Promise((resolve, reject) => {
    const proc = spawn(cmd, args, { cwd, shell: true, stdio: 'pipe' })
    proc.stdout?.on('data', (d) => {
      const line = d.toString().trim()
      if (line) {
        console.info(`[Chakra][${cmd}] ${line}`)
        onLog?.(line)
      }
    })
    proc.stderr?.on('data', (d) => {
      const line = d.toString().trim()
      if (line) {
        console.warn(`[Chakra][${cmd}] ${line}`)
        onLog?.(line)
      }
    })
    proc.on('close', (code) => {
      if (code === 0) resolve()
      else reject(new Error(`${cmd} exited with code ${code}`))
    })
    proc.on('error', reject)
  })
}

// Common built-output paths to search for the entry point after build
const ENTRY_CANDIDATES = ['dist/index.html', 'build/index.html', 'out/renderer/index.html', 'public/index.html', 'index.html']

export const findAppEntryPoint = (installPath: string): string | null => {
  for (const candidate of ENTRY_CANDIDATES) {
    const p = join(installPath, candidate)
    if (existsSync(p)) return p
  }
  return null
}

export const getInstallRecord = (appId: string): { installPath: string | null } => {
  const db = getDb()
  const rec = db.select().from(installedApps).where(eq(installedApps.appId, appId)).get()
  return { installPath: rec?.installPath ?? null }
}

// ── Install / Uninstall / Launch ──────────────────────────────────────────────

export const installApp = async (
  appId: string,
  appName: string,
  cloneUrl: string,
  commitHash: string | null,
  onProgress?: InstallProgressCallback
): Promise<{ installPath: string }> => {
  const baseDir = await getAppsBaseDir()
  const safeName = appName.replace(/[^a-zA-Z0-9_-]/g, '_').toLowerCase()
  const installPath = join(baseDir, safeName)
  const hash = commitHash?.trim() || null

  // Step 1: Clone / fetch
  if (!existsSync(installPath)) {
    onProgress?.('clone', 5, '> Cloning repository...')
    await runCommand('git', ['clone', cloneUrl, installPath], undefined,
      (line) => onProgress?.('clone', 15, `> ${line.slice(0, 80)}`)
    )
    if (hash) {
      onProgress?.('clone', 22, `> Checking out ${hash.slice(0, 8)}...`)
      await runCommand('git', ['checkout', hash], installPath,
        (line) => onProgress?.('clone', 28, `> ${line.slice(0, 80)}`)
      )
    }
  } else {
    onProgress?.('clone', 5, '> Repository exists — fetching latest...')
    await runCommand('git', ['fetch', '--all'], installPath,
      (line) => onProgress?.('clone', 15, `> ${line.slice(0, 80)}`)
    )
    if (hash) {
      onProgress?.('clone', 22, `> Checking out ${hash.slice(0, 8)}...`)
      await runCommand('git', ['checkout', hash], installPath,
        (line) => onProgress?.('clone', 28, `> ${line.slice(0, 80)}`)
      )
    } else {
      onProgress?.('clone', 22, '> Pulling latest changes...')
      await runCommand('git', ['pull'], installPath,
        (line) => onProgress?.('clone', 28, `> ${line.slice(0, 80)}`)
      )
    }
  }
  onProgress?.('clone', 30, '> Clone complete.')

  const pkgPath = join(installPath, 'package.json')
  if (existsSync(pkgPath)) {
    // Step 2: npm install
    onProgress?.('install', 35, '> Installing dependencies...')
    await runCommand('npm', ['install', '--prefer-offline'], installPath,
      (line) => onProgress?.('install', 40, `> ${line.slice(0, 80)}`)
    )
    onProgress?.('install', 65, '> Dependencies installed.')

    // Step 3: npm run build (if script exists)
    const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'))
    if (pkg.scripts?.build) {
      onProgress?.('build', 70, '> Building application...')
      await runCommand('npm', ['run', 'build'], installPath,
        (line) => onProgress?.('build', 80, `> ${line.slice(0, 80)}`)
      )
      onProgress?.('build', 92, '> Build complete.')
    }
  }

  // Step 4: Register
  onProgress?.('finalize', 96, '> Registering with Chakra platform...')
  const db = getDb()
  db.insert(installedApps)
    .values({ appId, installedAt: Math.floor(Date.now() / 1000), installPath })
    .onConflictDoUpdate({
      target: installedApps.appId,
      set: { installedAt: Math.floor(Date.now() / 1000), installPath }
    })
    .run()

  onProgress?.('complete', 100, '> Installation complete.')
  console.info(`[Chakra] App installed: ${appName} → ${installPath}`)
  return { installPath }
}

export const uninstallApp = async (appId: string): Promise<void> => {
  const db = getDb()
  const rec = db.select().from(installedApps).where(eq(installedApps.appId, appId)).get()
  if (rec?.installPath && existsSync(rec.installPath)) {
    rmSync(rec.installPath, { recursive: true, force: true })
  }
  db.delete(installedApps).where(eq(installedApps.appId, appId)).run()
  console.info(`[Chakra] App uninstalled: ${appId}`)
}
