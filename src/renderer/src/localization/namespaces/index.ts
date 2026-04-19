import { enCommonTranslations } from './common'
import { enNavigationTranslations } from './navigation'
import { enOnboardingTranslations } from './onboarding'
import { enAuthTranslations } from './auth'
import { enInteractionTranslations } from './interaction'
import { enOperationsTranslations } from './operations'
import { enSettingsTranslations } from './settings'

export const enNamespaces = {
  common: enCommonTranslations,
  navigation: enNavigationTranslations,
  onboarding: enOnboardingTranslations,
  auth: enAuthTranslations,
  interaction: enInteractionTranslations,
  operations: enOperationsTranslations,
  settings: enSettingsTranslations
}

export const translations = {
  en: {
    ...enNamespaces.common,
    ...enNamespaces.navigation,
    ...enNamespaces.onboarding,
    ...enNamespaces.auth,
    ...enNamespaces.interaction,
    ...enNamespaces.operations,
    ...enNamespaces.settings
  }
}
