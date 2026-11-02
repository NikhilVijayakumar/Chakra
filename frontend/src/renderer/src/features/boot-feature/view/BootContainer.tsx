import { FC, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
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

  useEffect(() => {
    const maxBootTime = setTimeout(() => {
      console.warn('[Chakra] Boot sequence exceeded maximum time. Falling back to login.')
      navigate('/login', { replace: true })
    }, 30000)

    return () => {
      clearTimeout(maxBootTime)
    }
  }, [navigate])

  const handleComplete = () => {
    navigate('/login', { replace: true })
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
