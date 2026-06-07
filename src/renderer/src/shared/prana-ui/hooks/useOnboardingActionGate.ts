export interface OnboardingActionGate {
  allowed: boolean
  reason?: string
}

export const useOnboardingActionGate = (): OnboardingActionGate => ({ allowed: true })
