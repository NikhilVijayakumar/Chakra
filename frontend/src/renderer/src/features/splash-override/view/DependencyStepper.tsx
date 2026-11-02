import { FC } from 'react'
import { Box, Typography, CircularProgress, Button } from '@mui/material'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline'
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked'

import { useDependencyCheckViewModel } from '../viewmodel/useDependencyCheckViewModel'

type DependencyId = 'ssh' | 'git' | 'virtual-drive'

const DEPENDENCY_LABELS: Record<DependencyId, string> = {
  ssh: 'SSH',
  git: 'Git',
  'virtual-drive': 'Virtual Drive'
}

const getIconForStatus = (status: 'pending' | 'loading' | 'success' | 'error', size: number = 24) => {
  const style = { fontSize: size }
  switch (status) {
    case 'loading':
      return <CircularProgress size={size} thickness={4} sx={{ color: 'primary.main' }} />
    case 'success':
      return <CheckCircleIcon sx={{ color: 'success.main', ...style }} />
    case 'error':
      return <ErrorOutlineIcon sx={{ color: 'error.main', ...style }} />
    case 'pending':
    default:
      return <RadioButtonUncheckedIcon sx={{ color: 'text.disabled', ...style }} />
  }
}

export const DependencyStepper: FC = () => {
  const { checkState, dependencyStatuses, blockedMessage, handleRetry } = useDependencyCheckViewModel()

  const getLastIndex = dependencyStatuses.length - 1

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        width: '100vw',
        bgcolor: 'background.default',
        p: 4
      }}
    >
      <Box sx={{ mb: 4, textAlign: 'center' }}>
        <Typography
          variant="h4"
          sx={{ fontWeight: 700, letterSpacing: '-0.5px', color: 'text.primary' }}
        >
          Chakra
        </Typography>
        <Typography variant="subtitle1" sx={{ color: 'text.secondary', mt: 1 }}>
          Checking dependencies...
        </Typography>
      </Box>

      <Box
        sx={{
          width: '100%',
          maxWidth: 520,
          p: 4,
          borderRadius: 3,
          bgcolor: 'background.paper',
          border: 1,
          borderColor: 'divider',
          boxShadow: 4
        }}
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {dependencyStatuses.map((dep, index) => {
            const isLast = index === getLastIndex
            const showConnector = !isLast

            return (
              <Box key={dep.dependency} sx={{ display: 'flex', position: 'relative' }}>
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    mr: 3
                  }}
                >
                  <Box
                    sx={{
                      position: 'relative',
                      zIndex: 2,
                      bgcolor: 'background.paper',
                      borderRadius: '50%'
                    }}
                  >
                    {getIconForStatus(dep.status)}
                  </Box>
                  {showConnector && (
                    <Box
                      sx={{
                        flexGrow: 1,
                        width: '2px',
                        minHeight: '40px',
                        bgcolor: 'divider',
                        mt: -1
                      }}
                    />
                  )}
                </Box>
                <Box sx={{ flex: 1, pb: isLast ? 0 : 3 }}>
                  <Typography
                    variant="body1"
                    fontWeight={500}
                    color={
                      dep.status === 'error'
                        ? 'error.main'
                        : dep.status === 'success'
                          ? 'success.main'
                          : 'text.primary'
                    }
                  >
                    {DEPENDENCY_LABELS[dep.dependency]}
                  </Typography>
                  {dep.message && (
                    <Typography variant="body2" color="text.secondary">
                      {dep.message}
                    </Typography>
                  )}
                </Box>
              </Box>
            )
          })}
        </Box>
      </Box>

      {checkState === 'blocking' && (
        <Box
          sx={{
            mt: 4,
            p: 3,
            borderRadius: 2,
            bgcolor: 'error.dark',
            maxWidth: 520,
            width: '100%'
          }}
        >
          <Typography color="error.contrastText" sx={{ mb: 2 }}>
            Startup blocked: {blockedMessage}
          </Typography>
          <Button variant="contained" color="error" onClick={handleRetry}>
            Retry Check
          </Button>
        </Box>
      )}

      {checkState === 'completed' && (
        <Box sx={{ mt: 4, textAlign: 'center' }}>
          <Typography color="success.main">
            All dependencies available. Starting...
          </Typography>
        </Box>
      )}
    </Box>
  )
}