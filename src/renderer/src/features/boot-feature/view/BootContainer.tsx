import { FC } from 'react'
import { useNavigate } from 'react-router-dom'
import { volatileSessionStore } from 'prana/ui/authentication/state/volatileSessionStore'
import { useBootViewModel } from '../viewmodel/useBootViewModel'
import { BootView } from './BootView'

/**
 * BootContainer
 * 
 * Wraps BootView with:
 * - Session management logic
 * - Navigation on completion
 * - SSH/dependency failure handling
 */
export const BootContainer: FC = () => {
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

  const { stages, handleRetry, isFatalActionableError } = useBootViewModel(
    handleComplete,
    handleSshFailure
  )

  return (
    <BootView
      stages={stages}
      onRetry={handleRetry}
      canRetry={isFatalActionableError}
    />
  )
}
