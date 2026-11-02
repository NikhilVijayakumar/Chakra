import { FC, useEffect, useState } from 'react'
import { Box, Typography, useTheme } from '@mui/material'
import { motion } from 'framer-motion'

interface BootAnimatedHeaderProps {
  title: string
  subtitle?: string
  animated?: boolean
}

/**
 * BootAnimatedHeader
 * 
 * Animated header component with cascading letter animation.
 * Inspired by kinetic minimalism design from boot.html mockup.
 * 
 * Reusable for Astra component library.
 */
export const BootAnimatedHeader: FC<BootAnimatedHeaderProps> = ({
  title,
  subtitle,
  animated = true
}) => {
  const theme = useTheme()
  const [letterStates, setLetterStates] = useState<string[]>([])

  useEffect(() => {
    if (animated && title) {
      setLetterStates(title.split(''))
    } else {
      setLetterStates([])
    }
  }, [title, animated])

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: animated ? 0.15 : 0,
        delayChildren: animated ? 0.2 : 0
      }
    }
  }

  const letterVariants = {
    hidden: { opacity: 0, y: -6 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: 'spring',
        stiffness: 120,
        damping: 12
      }
    },
    hover: {
      color: theme.palette.primary.main,
      scale: 1.05,
      transition: { duration: 0.2 }
    }
  }

  if (!animated || letterStates.length === 0) {
    return (
      <Box sx={{ mb: subtitle ? 2 : 4, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Typography
          variant="h3"
          sx={{
            fontWeight: 900,
            letterSpacing: '-0.03em',
            color: theme.palette.text.primary,
            textAlign: 'center'
          }}
        >
          {title}
        </Typography>
        {subtitle && (
          <Typography
            variant="subtitle1"
            sx={{ color: theme.palette.text.secondary, mt: 1, textAlign: 'center' }}
          >
            {subtitle}
          </Typography>
        )}
      </Box>
    )
  }

  return (
    <Box sx={{ mb: subtitle ? 2 : 4, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        style={{
          display: 'flex',
          gap: '12px',
          justifyContent: 'center',
          flexWrap: 'wrap'
        }}
      >
        {letterStates.map((letter, idx) => (
          <motion.div
            key={`${letter}-${idx}`}
            variants={letterVariants}
            whileHover="hover"
            style={{ cursor: 'default' }}
          >
            <Typography
              variant="h3"
              component="span"
              sx={{
                fontWeight: 900,
                letterSpacing: '-0.03em',
                color: theme.palette.text.primary,
                display: 'inline-block'
              }}
            >
              {letter}
            </Typography>
          </motion.div>
        ))}
      </motion.div>

      {subtitle && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: title.length * 0.15 + 0.4, duration: 0.4 }}
        >
          <Typography
            variant="subtitle1"
            sx={{ color: theme.palette.text.secondary, mt: 2, textAlign: 'center' }}
          >
            {subtitle}
          </Typography>
        </motion.div>
      )}
    </Box>
  )
}
