import type { PranaBrandingConfig } from 'prana/ui/constants/pranaConfig'

/**
 * Dhi branding constants.
 *
 * Centralised here so every route shares a single object reference.
 * Once prana implements the Cold-Vault branding store
 * (setPranaBrandingConfig / getPranaBranding) this file becomes the
 * single call-site for seeding the store and can be removed entirely.
 *
 * @see docs/issue/prana/branding-config-cold-vault-migration-2026-03-31.md
 */
export const DHI_BRANDING: Partial<PranaBrandingConfig> = {
  appBrandName: 'DHI Executive Suite',
  appTitlebarTagline: 'Governance-first autonomous operations',
  appSplashSubtitle: 'Initializing secure workspace',
  directorSenderEmail: 'director@dhi.local',
  directorSenderName: 'Director Office'
}
