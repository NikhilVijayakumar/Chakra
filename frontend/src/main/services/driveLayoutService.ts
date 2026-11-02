import { mkdir } from 'node:fs/promises'
import { join } from 'node:path'
import driveLayoutConfig from '../../../config/drive-layout.json'

export interface DriveQuotaConfig {
  maxStorageMb: number
  warnAtPercent: number
  pollIntervalMs: number
}

export interface DriveLayout {
  version: number
  description: string
  quota: DriveQuotaConfig
  directories: Record<string, unknown>
}

/**
 * Recursively flatten a nested directory tree object into a list of relative paths.
 *
 * Example input:
 *   { cache: { temp: {}, thumbnails: {} }, data: { governance: {} } }
 *
 * Output:
 *   ['cache', 'cache/temp', 'cache/thumbnails', 'data', 'data/governance']
 */
const flattenDirectoryTree = (
  tree: Record<string, unknown>,
  parentPath = ''
): string[] => {
  const paths: string[] = []

  for (const [key, subtree] of Object.entries(tree)) {
    const currentPath = parentPath ? `${parentPath}/${key}` : key
    paths.push(currentPath)

    if (subtree && typeof subtree === 'object' && !Array.isArray(subtree)) {
      paths.push(...flattenDirectoryTree(subtree as Record<string, unknown>, currentPath))
    }
  }

  return paths
}

let cachedLayout: DriveLayout | null = null

const loadLayout = (): DriveLayout => {
  if (cachedLayout) {
    return cachedLayout
  }

  // The JSON is bundled at build time via the Vite import above.
  // At runtime, the resolved config comes from the built chunk.
  const layout = driveLayoutConfig as DriveLayout

  if (!layout.directories || typeof layout.directories !== 'object') {
    throw new Error('[Chakra] drive-layout.json is missing a valid "directories" object')
  }

  if (!layout.quota || typeof layout.quota.maxStorageMb !== 'number') {
    throw new Error('[Chakra] drive-layout.json is missing a valid "quota.maxStorageMb" value')
  }

  cachedLayout = layout
  return layout
}

/**
 * Ensure every directory in the layout tree exists under the given drive root.
 * This is additive-only: existing directories are never removed.
 */
const ensureDirectories = async (driveRoot: string): Promise<string[]> => {
  const layout = loadLayout()
  const relativePaths = flattenDirectoryTree(layout.directories)
  const created: string[] = []

  for (const relativePath of relativePaths) {
    const absolutePath = join(driveRoot, relativePath)
    try {
      await mkdir(absolutePath, { recursive: true })
      created.push(relativePath)
    } catch (error: unknown) {
      // EEXIST is fine (directory already exists). Anything else is a real error.
      if (error && typeof error === 'object' && 'code' in error && (error as { code: string }).code !== 'EEXIST') {
        console.warn(`[Chakra] Could not create drive layout directory ${relativePath}:`, error)
      }
    }
  }

  console.info(`[Chakra] Drive layout verified: ${created.length} directories ensured under ${driveRoot}`)
  return created
}

/**
 * Resolve a layout-relative path (e.g. 'cache/temp') to an absolute path on the mounted drive.
 */
const resolvePath = (driveRoot: string, layoutPath: string): string => {
  return join(driveRoot, layoutPath)
}

/**
 * Get the list of all directory paths defined in the layout.
 */
const getDirectoryPaths = (): string[] => {
  return flattenDirectoryTree(loadLayout().directories)
}

/**
 * Get the quota config from the layout.
 */
const getQuotaConfig = (): DriveQuotaConfig => {
  return loadLayout().quota
}

/**
 * Get the reported total size in bytes (for rclone --vfs-disk-space-total-size).
 */
const getReportedTotalSizeBytes = (): number => {
  return loadLayout().quota.maxStorageMb * 1024 * 1024
}

export const driveLayoutService = {
  loadLayout,
  ensureDirectories,
  resolvePath,
  getDirectoryPaths,
  getQuotaConfig,
  getReportedTotalSizeBytes
}
