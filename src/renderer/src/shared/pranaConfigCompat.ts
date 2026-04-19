import { createContext, createElement, useContext, type FC, type ReactNode } from 'react'

export interface PranaBrandingConfig {
  appBrandName?: string
  appTitlebarTagline?: string
  appSplashSubtitle?: string
  directorSenderEmail?: string
  directorSenderName?: string
}

const defaultBranding: PranaBrandingConfig =
  (window as Window & { __pranaBrandingConfig?: PranaBrandingConfig }).__pranaBrandingConfig ?? {}

const BrandingContext = createContext<PranaBrandingConfig>(defaultBranding)

export const BrandingProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const branding =
    (window as Window & { __pranaBrandingConfig?: PranaBrandingConfig }).__pranaBrandingConfig ??
    defaultBranding

  return createElement(BrandingContext.Provider, { value: branding }, children)
}

export const useBranding = (): PranaBrandingConfig => useContext(BrandingContext)

export const assertRequiredBrandingFields = (_identifier: string, _config: PranaBrandingConfig, _fields: string[]): void => {
  // Empty compat layer
}
