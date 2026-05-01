import { FC } from 'react'
import { Box, Button, useTheme } from '@mui/material'
import RefreshIcon from '@mui/icons-material/Refresh'
import { BootStageCard, BootStageStatus } from './BootStageCard'
import { motion } from 'framer-motion'

export interface BootSequenceStage {
  id: string
  title: string
  status: BootStageStatus
  errorMessage?: string
  detailMessage?: string
}

interface BootSequenceIndicatorProps {
  stages: BootSequenceStage[]
  onRetry?: () => void
  canRetry?: boolean
}

/**
 * BootSequenceIndicator
 * 
 * Displays the complete boot sequence with all stages.
 * Shows progression through stages with status indicators.
 * Reusable organism for Astra component library.
 */
export const BootSequenceIndicator: FC<BootSequenceIndicatorProps> = ({
  stages,
  onRetry,
  canRetry = false
}) => {
  const theme = useTheme()

  return (
    <Box
      sx={{
        width: '100%',
        maxWidth: 480,
        p: 3,
        borderRadius: 2,
        bgcolor: theme.palette.background.paper,
        border: `1px solid ${theme.palette.divider}`,
        boxShadow: theme.shadows[4]
      }}
    >
      {/* Stages */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0, mb: stages.length > 0 ? 3 : 0 }}>
        {stages.map((stage, index) => (
          <BootStageCard
            key={stage.id}
            title={stage.title}
            status={stage.status}
            errorMessage={stage.errorMessage}
            detailMessage={stage.detailMessage}
            isLast={index === stages.length - 1}
            showConnector={index < stages.length - 1}
          />
        ))}
      </Box>

      {/* Retry Button */}
      {canRetry && onRetry && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Button
            variant="outlined"
            size="small"
            startIcon={<RefreshIcon />}
            onClick={onRetry}
            fullWidth
            sx={{
              mt: 2,
              color: theme.palette.primary.main,
              borderColor: theme.palette.primary.main,
              '&:hover': {
                bgcolor: theme.palette.primary.main,
                color: theme.palette.primary.contrastText
              }
            }}
          >
            Retry
          </Button>
        </motion.div>
      )}
    </Box>
  )
}
