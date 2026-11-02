import { FC, ReactNode } from 'react'
import { EntryLayoutFrame } from 'astra/components'
import { useBranding } from 'prana/ui/constants/pranaConfig'
import { DHI_BRANDING } from '@renderer/common/constants/dhiBranding'

interface BrandedPreAuthLayoutProps {
  children: ReactNode
}

export const BrandedPreAuthLayout: FC<BrandedPreAuthLayoutProps> = ({ children }) => {
  const branding = useBranding()
  const titleText = branding.appBrandName?.trim() || DHI_BRANDING.appBrandName || 'Prana'

  return <EntryLayoutFrame titleText={titleText}>{children}</EntryLayoutFrame>
}
