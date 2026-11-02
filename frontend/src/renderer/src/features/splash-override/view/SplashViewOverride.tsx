import { FC } from 'react'
import { Box, Typography, CircularProgress, Button, useTheme as useMuiTheme } from '@mui/material'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline'
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked'
import RefreshIcon from '@mui/icons-material/Refresh'
import SkipNextIcon from '@mui/icons-material/SkipNext'
import { SplashStage } from '../viewmodel/useDhiSplashViewModel'

interface SplashViewOverrideProps {
  stages: SplashStage[]
  onRetry: () => void
  canRetry: boolean
  currentStepIndex: number
}

export const SplashViewOverride: FC<SplashViewOverrideProps> = ({ stages, onRetry, canRetry }) => {
  const muiTheme = useMuiTheme()

  const getIconForStatus = (status: SplashStage['status']) => {
    switch (status) {
      case 'loading':
        return (
          <CircularProgress size={24} thickness={4} sx={{ color: muiTheme.palette.primary.main }} />
        )
      case 'success':
        return <CheckCircleIcon sx={{ color: muiTheme.palette.success.main, fontSize: 24 }} />
      case 'skipped':
        return <SkipNextIcon sx={{ color: muiTheme.palette.warning.main, fontSize: 24 }} />
      case 'error':
        return <ErrorOutlineIcon sx={{ color: muiTheme.palette.error.main, fontSize: 24 }} />
      case 'pending':
      default:
        return (
          <RadioButtonUncheckedIcon sx={{ color: muiTheme.palette.text.disabled, fontSize: 24 }} />
        )
    }
  }

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        width: '100vw',
        bgcolor: muiTheme.palette.background.default
      }}
    >
      <Box sx={{ mb: 6, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Typography
          variant="h3"
          sx={{ fontWeight: 700, letterSpacing: '-0.5px', color: muiTheme.palette.text.primary }}
        >
          Dhi
        </Typography>
        <Typography variant="subtitle1" sx={{ color: muiTheme.palette.text.secondary, mt: 1 }}>
          Initializing Executive Suite
        </Typography>
      </Box>

      <Box
        sx={{
          width: '100%',
          maxWidth: 480,
          p: 4,
          borderRadius: 3,
          bgcolor: muiTheme.palette.background.paper,
          border: `1px solid ${muiTheme.palette.divider}`,
          boxShadow: muiTheme.shadows[4]
        }}
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {stages.map((stage, index) => {
            const isLast = index === stages.length - 1
            const isFuture = stage.status === 'pending'
            const isActive = stage.status === 'loading'

            return (
              <Box key={stage.id} sx={{ display: 'flex', position: 'relative' }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mr: 3 }}>
                  <Box
                    sx={{
                      position: 'relative',
                      zIndex: 2,
                      bgcolor: muiTheme.palette.background.paper,
                      borderRadius: '50%',
                      transform: isActive ? 'scale(1.1)' : 'none',
                      transition: 'transform 0.2s ease-in-out'
                    }}
                  >
                    {getIconForStatus(stage.status)}
                  </Box>
                  {!isLast && (
                    <Box
                      sx={{
                        flexGrow: 1,
                        width: '2px',
                        minHeight: '40px',
                        my: 1,
                        bgcolor:
                          stage.status === 'success' || stage.status === 'skipped'
                            ? muiTheme.palette.success.main
                            : muiTheme.palette.divider,
                        opacity: isFuture ? 0.3 : 1,
                        transition: 'background-color 0.4s ease'
                      }}
                    />
                  )}
                </Box>

                <Box sx={{ pb: isLast ? 0 : 4, pt: 0.5, flexGrow: 1, opacity: isFuture ? 0.6 : 1 }}>
                  <Typography
                    variant="body1"
                    sx={{
                      fontWeight: isActive || stage.status === 'error' ? 600 : 400,
                      color:
                        stage.status === 'error'
                          ? muiTheme.palette.error.main
                          : muiTheme.palette.text.primary
                    }}
                  >
                    {stage.title}
                  </Typography>

                  {/* detail text on success or skipped */}
                  {(stage.status === 'success' || stage.status === 'skipped') &&
                    stage.detailMessage && (
                      <Typography
                        variant="body2"
                        sx={{
                          mt: 0.5,
                          color:
                            stage.status === 'skipped'
                              ? muiTheme.palette.warning.main
                              : muiTheme.palette.text.secondary
                        }}
                      >
                        {stage.detailMessage}
                      </Typography>
                    )}

                  {/* Expanded Error Card */}
                  {stage.status === 'error' && (
                    <Box
                      sx={{
                        mt: 2,
                        p: 2,
                        borderRadius: 1,
                        bgcolor: 'rgba(239, 68, 68, 0.1)',
                        border: `1px solid ${muiTheme.palette.error.light}`
                      }}
                    >
                      <Typography
                        variant="body2"
                        sx={{
                          mb: 2,
                          color: muiTheme.palette.error.main,
                          fontFamily: 'monospace',
                          whiteSpace: 'pre-wrap',
                          wordBreak: 'break-word'
                        }}
                      >
                        {stage.errorMessage || 'An unknown error occurred.'}
                      </Typography>

                      {canRetry && (
                        <Button
                          variant="contained"
                          color="error"
                          size="small"
                          startIcon={<RefreshIcon />}
                          onClick={onRetry}
                          disableElevation
                        >
                          Retry Stage
                        </Button>
                      )}
                    </Box>
                  )}
                </Box>
              </Box>
            )
          })}
        </Box>
      </Box>
    </Box>
  )
}
