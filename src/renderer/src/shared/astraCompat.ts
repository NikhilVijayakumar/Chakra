import { Alert, Box, CircularProgress } from '@mui/material'
import { createElement, Fragment } from 'react'
import type { FC, ReactNode } from 'react'
import { StateType } from '@astra-package'

export * from '@astra-package'

interface AppStateLike<T> {
  state: StateType
  isError: boolean
  isSuccess: boolean
  statusMessage?: string
  data: T | null
}

export interface AppStateHandlerProps<T, S extends AppStateLike<T> = AppStateLike<T>> {
  appState: S
  SuccessComponent?: FC<{ appState: S }>
  emptyCondition?: (data: T) => boolean
  errorMessage?: string
  children?: ReactNode
}

export const AppStateHandler = <T, S extends AppStateLike<T>>({
  appState,
  SuccessComponent,
  children,
  emptyCondition,
  errorMessage
}: AppStateHandlerProps<T, S>) => {
  if (appState.state === StateType.LOADING) {
    return createElement(
      Box,
      { sx: { display: 'grid', placeItems: 'center', minHeight: 160 } },
      createElement(CircularProgress, { size: 28 })
    )
  }

  if (appState.isError) {
    return createElement(
      Alert,
      { severity: 'error' },
      errorMessage ?? appState.statusMessage ?? 'Unable to load data.'
    )
  }

  if (!appState.isSuccess || appState.data == null) {
    return null
  }

  if (emptyCondition?.(appState.data)) {
    return createElement(Alert, { severity: 'info' }, 'No data available.')
  }

  if (SuccessComponent) {
    return createElement(SuccessComponent, { appState })
  }

  return createElement(Fragment, null, children)
}

export { DynamicProfileRenderer } from 'prana/ui/components/DynamicProfileRenderer'
export { getEmployeeAvatarPath } from 'prana/ui/constants/employeeDirectory'
export { useOnboardingActionGate } from 'prana/ui/hooks/useOnboardingActionGate'
export { SkillRepo } from 'prana/ui/repo/skills'
export { useLifecycle } from 'prana/ui/state/LifecycleProvider'

export type { OnboardingActionGate } from 'prana/ui/hooks/useOnboardingActionGate'
export type { SkillEntry } from 'prana/ui/repo/skills'
export type { LifecycleGlobalSkill, LifecycleProfileDraft } from 'prana/ui/state/LifecycleProvider'
