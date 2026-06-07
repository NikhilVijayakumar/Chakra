import { type FC } from 'react'

interface DynamicProfileRendererProps {
  profileId?: string
  [key: string]: unknown
}

export const DynamicProfileRenderer: FC<DynamicProfileRendererProps> = () => null
