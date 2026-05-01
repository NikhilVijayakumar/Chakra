import { FC } from 'react'
import { Box, Typography, CircularProgress, useTheme } from '@mui/material'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline'
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked'
import SkipNextIcon from '@mui/icons-material/SkipNext'
import { motion } from 'framer-motion'

export type BootStageStatus = 'pending' | 'loading' | 'success' | 'error' | 'skipped'

interface BootStageCardProps {
  title: string
  detailMessage?: string
  errorMessage?: string
  status: BootStageStatus
  isLast?: boolean
  showConnector?: boolean
}

/**
 * BootStageCard
 * 
 * Displays a single boot stage in the sequence.
 * Shows status with icon, title, and optional messages.
 * Reusable molecule for Astra component library.
 */
export const BootStageCard: FC<BootStageCardProps> = ({
  title,
  detailMessage,
  errorMessage,
  status,
  isLast = false,
  showConnector = true
}) => {
  const theme = useTheme()

  const getIcon = () => {
    const iconProps = { fontSize: 24 as const }
    switch (status) {
      case 'loading':
        return <CircularProgress size={24} thickness={4} sx={{ color: theme.palette.primary.main }} />
      case 'success':
        return <CheckCircleIcon sx={{ ...iconProps, color: theme.palette.success.main }} />
      case 'skipped':
        return <SkipNextIcon sx={{ ...iconProps, color: theme.palette.warning.main }} />
      case 'error':
        return <ErrorOutlineIcon sx={{ ...iconProps, color: theme.palette.error.main }} />
      case 'pending':
      default:
        return <RadioButtonUncheckedIcon sx={{ ...iconProps, color: theme.palette.text.disabled }} />
    }
  }

  const isActive = status === 'loading'
  const isFuture = status === 'pending'

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
      style={{ display: 'flex', position: 'relative', width: '100%' }}
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mr: 3 }}>
        <Box
          sx={{
            position: 'relative',
            zIndex: 2,
            bgcolor: theme.palette.background.paper,
            borderRadius: '50%',
            transform: isActive ? 'scale(1.1)' : 'none',
            transition: 'transform 0.2s ease-in-out'
          }}
        >
          {getIcon()}
        </Box>
        {!isLast && showConnector && (
          <Box
            sx={{
              flexGrow: 1,
              width: '2px',
              minHeight: '40px',
              my: 1,
              bgcolor:
                status === 'success' || status === 'skipped'
                  ? theme.palette.success.main
                  : theme.palette.divider,
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
            fontWeight: isActive || status === 'error' ? 600 : 400,
            color:
              status === 'error'
                ? theme.palette.error.main
                : theme.palette.text.primary
          }}
        >
          {title}
        </Typography>

        {/* Detail message on success or skipped */}
        {(status === 'success' || status === 'skipped') && detailMessage && (
          <Typography
            variant="body2"
            sx={{
              mt: 0.5,
              color:
                status === 'skipped'
                  ? theme.palette.warning.main
                  : theme.palette.text.secondary
            }}
          >
            {detailMessage}
          </Typography>
        )}

        {/* Error message */}
        {status === 'error' && errorMessage && (
          <Box
            sx={{
              mt: 2,
              p: 2,
              borderRadius: 1,
              bgcolor: theme.palette.error.light,
              border: `1px solid ${theme.palette.error.main}`,
              display: 'flex',
              gap: 1
            }}
          >
            <Typography
              variant="body2"
              sx={{
                color: theme.palette.error.main,
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word'
              }}
            >
              {errorMessage}
            </Typography>
          </Box>
        )}

        {/* Loading message */}
        {status === 'loading' && detailMessage && (
          <Typography
            variant="body2"
            sx={{
              mt: 0.5,
              color: theme.palette.text.secondary,
              fontStyle: 'italic'
            }}
          >
            {detailMessage}
          </Typography>
        )}
      </Box>
    </motion.div>
  )
}
