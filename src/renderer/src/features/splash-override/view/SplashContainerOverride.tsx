import { FC } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDhiSplashViewModel } from '../viewmodel/useDhiSplashViewModel'
import { SplashViewOverride } from './SplashViewOverride'
import { volatileSessionStore } from 'prana/ui/authentication/state/volatileSessionStore'

export const SplashContainerOverride: FC = () => {
  const navigate = useNavigate()

  const handleComplete = () => {
    const hasSession = volatileSessionStore.hasSession()

    if (!hasSession) {
      navigate('/login')
      return
    }

    navigate('/apps')
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
