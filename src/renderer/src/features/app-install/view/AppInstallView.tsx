import { FC } from 'react'
import { Box, Typography, LinearProgress } from '@mui/material'
import { motion, AnimatePresence } from 'framer-motion'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import DownloadIcon from '@mui/icons-material/Download'
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline'
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline'

export type InstallPhase = 'installing' | 'complete' | 'error'

export interface AppInstallViewProps {
  appName: string
  phase: InstallPhase
  progress: number
  currentLog: string
  error: string | null
  onCancel: () => void
  onDone: () => void
}

const C = {
  bg: '#090B10',
  card: '#12141A',
  border: 'rgba(255,255,255,0.08)',
  primary: '#5A60F5',
  success: '#34C759',
  error: '#ED5F74',
  textPrimary: '#F2F2F3',
  textSecondary: '#8A8F98'
}

const PhaseIcon: FC<{ phase: InstallPhase }> = ({ phase }) => {
  const bg =
    phase === 'complete' ? C.success :
    phase === 'error'    ? C.error :
    C.primary

  return (
    <motion.div
      animate={{ scale: phase === 'complete' ? [1, 1.15, 1] : 1 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
    >
      <Box sx={{
        width: 64, height: 64, borderRadius: 2,
        bgcolor: bg,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        mx: 'auto', mb: 3,
        boxShadow: `0 0 24px ${bg}55`,
        transition: 'background-color 0.4s ease, box-shadow 0.4s ease'
      }}>
        {phase === 'complete' ? (
          <CheckCircleOutlineIcon sx={{ color: '#fff', fontSize: 32 }} />
        ) : phase === 'error' ? (
          <ErrorOutlineIcon sx={{ color: '#fff', fontSize: 32 }} />
        ) : (
          <DownloadIcon sx={{ color: '#fff', fontSize: 32 }} />
        )}
      </Box>
    </motion.div>
  )
}

export const AppInstallView: FC<AppInstallViewProps> = ({
  appName,
  phase,
  progress,
  currentLog,
  error,
  onCancel,
  onDone
}) => {
  const title =
    phase === 'complete' ? 'Installation Complete' :
    phase === 'error'    ? 'Installation Failed' :
    `Installing ${appName}...`

  const subtitle =
    phase === 'complete' ? `${appName} is now available in your platform.` :
    phase === 'error'    ? (error ?? 'An error occurred during installation.') :
    'Setting up your application securely.'

  return (
    <Box sx={{
      minHeight: '100vh',
      bgcolor: C.bg,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      fontFamily: 'Inter, system-ui, sans-serif'
    }}>
      {/* Cancel / back button */}
      <Box
        onClick={phase !== 'installing' ? onDone : onCancel}
        sx={{
          position: 'fixed', top: 24, left: 24,
          display: 'flex', alignItems: 'center', gap: 1,
          px: 2, py: 1,
          bgcolor: C.card,
          border: `1px solid ${C.border}`,
          borderRadius: 1.5,
          cursor: 'pointer',
          color: C.textPrimary,
          fontSize: 14, fontWeight: 600,
          transition: 'border-color 0.15s, color 0.15s',
          '&:hover': { borderColor: C.primary, color: C.primary }
        }}
      >
        <ArrowBackIcon sx={{ fontSize: 16 }} />
        {phase !== 'installing' ? 'Back to Home' : 'Cancel Install'}
      </Box>

      {/* Central card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      >
        <Box sx={{
          bgcolor: C.card,
          border: `1px solid ${C.border}`,
          borderRadius: 3,
          p: '48px',
          textAlign: 'center',
          width: 380,
          maxWidth: 'calc(100vw - 48px)'
        }}>
          <PhaseIcon phase={phase} />

          <AnimatePresence mode="wait">
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2 }}
            >
              <Typography sx={{ fontSize: 20, fontWeight: 700, color: C.textPrimary, mb: 1 }}>
                {title}
              </Typography>
              <Typography sx={{ fontSize: 14, color: C.textSecondary, mb: 4, minHeight: 40 }}>
                {subtitle}
              </Typography>
            </motion.div>
          </AnimatePresence>

          {/* Progress bar */}
          <Box sx={{ mb: 2 }}>
            <LinearProgress
              variant="determinate"
              value={progress}
              sx={{
                height: 8,
                borderRadius: 1,
                bgcolor: 'rgba(255,255,255,0.06)',
                '& .MuiLinearProgress-bar': {
                  bgcolor:
                    phase === 'complete' ? C.success :
                    phase === 'error'    ? C.error :
                    C.primary,
                  borderRadius: 1,
                  transition: 'width 0.3s linear, background-color 0.4s ease'
                }
              }}
            />
          </Box>

          {/* Log output */}
          <Box sx={{
            textAlign: 'left',
            mt: 2,
            minHeight: 20
          }}>
            <AnimatePresence mode="wait">
              <motion.div
                key={currentLog}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
              >
                <Typography sx={{
                  fontFamily: 'JetBrains Mono, Consolas, monospace',
                  fontSize: 12,
                  color: phase === 'error' ? C.error : C.textSecondary,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}>
                  {currentLog || ' '}
                </Typography>
              </motion.div>
            </AnimatePresence>
          </Box>

          {/* Done button */}
          {(phase === 'complete' || phase === 'error') && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: 0.1 }}
            >
              <Box
                onClick={onDone}
                sx={{
                  mt: 4,
                  py: 1.25,
                  borderRadius: 1.5,
                  bgcolor: phase === 'complete' ? C.success : C.error,
                  cursor: 'pointer',
                  color: '#fff',
                  fontWeight: 600,
                  fontSize: 14,
                  transition: 'opacity 0.15s',
                  '&:hover': { opacity: 0.88 }
                }}
              >
                {phase === 'complete' ? 'Go to Home' : 'Back to Home'}
              </Box>
            </motion.div>
          )}
        </Box>
      </motion.div>
    </Box>
  )
}
