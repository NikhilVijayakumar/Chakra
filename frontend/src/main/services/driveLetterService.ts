import { execSync } from 'node:child_process'

const PREFERRED_SYSTEM_LETTERS = ['S', 'T', 'U', 'W', 'X', 'Y', 'Z', 'N', 'M', 'L', 'K', 'J']
const PREFERRED_VAULT_LETTERS = ['V', 'W', 'X', 'Y', 'Z', 'N', 'M', 'L', 'K', 'J']

const getUsedDriveLetters = (): Set<string> => {
  try {
    const output = execSync('wmic logicaldisk get caption', {
      encoding: 'utf8',
      timeout: 5_000,
      windowsHide: true
    })
    const used = new Set<string>()
    for (const line of output.split('\n')) {
      const m = line.trim().match(/^([A-Za-z]):$/)
      if (m) used.add(m[1].toUpperCase())
    }
    return used
  } catch {
    return new Set()
  }
}

/**
 * Picks two free Windows drive letters: one for the system virtual drive,
 * one for the vault virtual drive. Returns undefined on non-Windows platforms.
 */
export const pickFreeDriveLetters = (): { system: string; vault: string } | undefined => {
  if (process.platform !== 'win32') return undefined

  const used = getUsedDriveLetters()

  const systemLetter = PREFERRED_SYSTEM_LETTERS.find((l) => !used.has(l))
  if (!systemLetter) {
    console.warn('[Chakra] No free drive letter found for system virtual drive')
    return undefined
  }

  const vaultLetter = PREFERRED_VAULT_LETTERS.find((l) => l !== systemLetter && !used.has(l))
  if (!vaultLetter) {
    console.warn('[Chakra] No free drive letter found for vault virtual drive')
    return undefined
  }

  return { system: `${systemLetter}:`, vault: `${vaultLetter}:` }
}
