import { FC } from 'react'
import { Box, useTheme } from '@mui/material'
import { motion } from 'framer-motion'
import {
  BootAnimatedHeader,
  BootSequenceIndicator,
  BootSequenceStage
} from '@renderer/common/components/boot-astra'

interface BootViewProps {
  stages: BootSequenceStage[]
  onRetry: () => void
  canRetry: boolean
}

/**
 * BootView
 * 
 * Displays the boot/splash screen with animated header and sequence indicator.
 * Uses Astra theme (MUI 7) with kinetic minimalism design from mockup.
 * 
 * Design features:
 * - Animated letter cascade for title
 * - Timeline progress indicator
 * - Real-time validation status
 * - Error handling with retry
 */
export const BootView: FC<BootViewProps> = ({ stages, onRetry, canRetry }) => {
  const theme = useTheme()

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        width: '100vw',
        bgcolor: theme.palette.background.default,
        p: 3,
        overflow: 'hidden'
      }}
    >
      {/* Animated Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        style={{ marginBottom: '48px' }}
      >
        <BootAnimatedHeader
          title="CHAKRA"
          subtitle="Platform Initialization"
          animated={true}
        />
      </motion.div>

      {/* Sequence Indicator */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2, ease: 'easeOut' }}
      >
        <BootSequenceIndicator
          stages={stages}
          onRetry={onRetry}
          canRetry={canRetry}
        />
      </motion.div>
    </Box>
  )
}
