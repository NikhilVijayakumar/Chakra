import { FC } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDhiSplashViewModel } from '../viewmodel/useDhiSplashViewModel'
import { SplashViewOverride } from './SplashViewOverride'
import { volatileSessionStore } from 'prana/ui/authentication/state/volatileSessionStore'
import { getFirstEnabledMainRoute } from 'prana/ui/constants/moduleRegistry'

export const SplashContainerOverride: FC = () => {
  const navigate = useNavigate()

  const handleComplete = () => {
    const hasSession = volatileSessionStore.hasSession()

    if (!hasSession) {
      navigate('/login')
      return
    }

    navigate(getFirstEnabledMainRoute())
  }

  const handleSshFailure = () => {
    navigate('/access-denied')
  }

  const { stages, handleRetry, isFatalActionableError, currentStepIndex } = useDhiSplashViewModel(
    handleComplete,
    handleSshFailure
  )

  return (
    <SplashViewOverride
      stages={stages}
      onRetry={handleRetry}
      canRetry={isFatalActionableError}
      currentStepIndex={currentStepIndex}
    />
  )
}
