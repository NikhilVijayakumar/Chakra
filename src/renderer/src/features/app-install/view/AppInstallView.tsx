import { FC } from 'react'
import {
  Box,
  Stepper,
  Step,
  StepLabel,
  Button,
  Typography,
  LinearProgress,
  Card,
  CardContent,
  useTheme,
  Alert
} from '@mui/material'
import { motion } from 'framer-motion'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'

type InstallStep = 'select' | 'confirm' | 'installing' | 'complete'

interface InstallStepData {
  label: string
  description: string
  content?: string
}

interface AppInstallViewProps {
  step: InstallStep
  activeStep: number
  selectedAppId: string | null
  selectedAppName: string | null
  installProgress: number
  error: string | null
  isLoading: boolean
  onSelectApp: (appId: string, appName: string) => void
  onConfirmInstall: () => void
  onStartInstall: () => void
  onComplete: () => void
  onBack: () => void
}

const INSTALL_STEPS: InstallStepData[] = [
  {
    label: 'Select App',
    description: 'Choose an application to install'
  },
  {
    label: 'Confirm',
    description: 'Review installation details'
  },
  {
    label: 'Installing',
    description: 'Installing your application'
  },
  {
    label: 'Complete',
    description: 'Installation finished'
  }
]

const AVAILABLE_APPS = [
  {
    id: 'rita',
    name: 'RITA',
    description: 'Report generation and analytics',
    size: '512 MB',
    requirements: 'Minimum 1GB disk space'
  },
  {
    id: 'hrms',
    name: 'HRMS',
    description: 'Human resources management system',
    size: '256 MB',
    requirements: 'Minimum 512MB disk space'
  },
  {
    id: 'finance',
    name: 'Finance',
    description: 'Financial management and reporting',
    size: '384 MB',
    requirements: 'Minimum 768MB disk space'
  },
  {
    id: 'inventory',
    name: 'Inventory',
    description: 'Inventory tracking and management',
    size: '192 MB',
    requirements: 'Minimum 256MB disk space'
  }
]

/**
 * AppInstallView
 * 
 * Multi-step installation wizard:
 * 1. Select app from list
 * 2. Review installation details
 * 3. Execute installation with progress tracking
 * 4. Show completion
 */
export const AppInstallView: FC<AppInstallViewProps> = ({
  step,
  activeStep,
  selectedAppId,
  selectedAppName,
  installProgress,
  error,
  isLoading,
  onSelectApp,
  onConfirmInstall,
  onStartInstall,
  onComplete,
  onBack
}) => {
  const theme = useTheme()

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: theme.palette.background.default, p: { xs: 2, md: 4 } }}>
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={onBack}
        sx={{
          mb: 4,
          textTransform: 'none',
          color: theme.palette.text.secondary,
          '&:hover': { color: theme.palette.text.primary }
        }}
      >
        Back to Dashboard
      </Button>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Box sx={{ maxWidth: 800, mx: 'auto' }}>
          {/* Stepper */}
          <Card sx={{ mb: 4 }}>
            <CardContent>
              <Stepper activeStep={activeStep} sx={{ mb: 2 }}>
                {INSTALL_STEPS.map((installStep) => (
                  <Step key={installStep.label}>
                    <StepLabel>{installStep.label}</StepLabel>
                  </Step>
                ))}
              </Stepper>
            </CardContent>
          </Card>

          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

          {/* Step 1: Select App */}
          {step === 'select' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              <Typography variant="h5" sx={{ fontWeight: 600, mb: 3 }}>
                Select Application to Install
              </Typography>

              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2, mb: 4 }}>
                {AVAILABLE_APPS.map((app, index) => (
                  <motion.div
                    key={app.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, delay: 0.05 * index }}
                  >
                    <Card
                      sx={{
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        border: selectedAppId === app.id ? `2px solid ${theme.palette.primary.main}` : `1px solid ${theme.palette.divider}`,
                        bgcolor:
                          selectedAppId === app.id ? theme.palette.action.selected : 'transparent',
                        '&:hover': {
                          boxShadow: theme.shadows[2],
                          borderColor: theme.palette.primary.main
                        }
                      }}
                      onClick={() => onSelectApp(app.id, app.name)}
                    >
                      <CardContent>
                        <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                          {app.name}
                        </Typography>
                        <Typography variant="body2" sx={{ color: theme.palette.text.secondary, mb: 2 }}>
                          {app.description}
                        </Typography>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                            {app.size}
                          </Typography>
                          {selectedAppId === app.id && <CheckCircleIcon sx={{ color: theme.palette.primary.main }} />}
                        </Box>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </Box>

              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                <Button onClick={onBack} variant="outlined">
                  Cancel
                </Button>
                <Button
                  variant="contained"
                  disabled={!selectedAppId}
                  onClick={onConfirmInstall}
                >
                  Continue
                </Button>
              </Box>
            </motion.div>
          )}

          {/* Step 2: Confirm */}
          {step === 'confirm' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              <Typography variant="h5" sx={{ fontWeight: 600, mb: 3 }}>
                Confirm Installation
              </Typography>

              <Card sx={{ mb: 4 }}>
                <CardContent>
                  <Typography variant="subtitle2" sx={{ color: theme.palette.text.secondary, mb: 2 }}>
                    Application Details
                  </Typography>

                  {selectedAppId && (
                    <>
                      {(() => {
                        const app = AVAILABLE_APPS.find((a) => a.id === selectedAppId)
                        return app ? (
                          <>
                            <Box sx={{ mb: 2 }}>
                              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                {app.name}
                              </Typography>
                              <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                                {app.description}
                              </Typography>
                            </Box>

                            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mb: 2 }}>
                              <Box>
                                <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                                  Download Size
                                </Typography>
                                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                  {app.size}
                                </Typography>
                              </Box>
                              <Box>
                                <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                                  Requirements
                                </Typography>
                                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                  {app.requirements}
                                </Typography>
                              </Box>
                            </Box>
                          </>
                        ) : null
                      })()}
                    </>
                  )}

                  <Alert severity="info">
                    This will download and install the application. Make sure you have sufficient disk
                    space available.
                  </Alert>
                </CardContent>
              </Card>

              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                <Button
                  onClick={onBack}
                  variant="outlined"
                  disabled={isLoading}
                >
                  Back
                </Button>
                <Button
                  variant="contained"
                  onClick={onStartInstall}
                  disabled={isLoading}
                >
                  Install
                </Button>
              </Box>
            </motion.div>
          )}

          {/* Step 3: Installing */}
          {step === 'installing' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              <Typography variant="h5" sx={{ fontWeight: 600, mb: 3 }}>
                Installing {selectedAppName}
              </Typography>

              <Card>
                <CardContent>
                  <Box sx={{ mb: 3 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2">Installation Progress</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {installProgress}%
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={installProgress}
                      sx={{ height: 8, borderRadius: 1 }}
                    />
                  </Box>

                  <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                    Please wait while the application is being downloaded and installed...
                  </Typography>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Step 4: Complete */}
          {step === 'complete' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
            >
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <CheckCircleIcon
                  sx={{ fontSize: 80, color: theme.palette.success.main, mb: 2 }}
                />

                <Typography variant="h5" sx={{ fontWeight: 600, mb: 2 }}>
                  Installation Complete!
                </Typography>

                <Typography sx={{ color: theme.palette.text.secondary, mb: 4, maxWidth: 400, mx: 'auto' }}>
                  {selectedAppName} has been successfully installed and is ready to use. You can now launch it from
                  your dashboard.
                </Typography>

                <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
                  <Button variant="outlined" onClick={onBack}>
                    Back to Dashboard
                  </Button>
                  <Button variant="contained" onClick={onComplete}>
                    Done
                  </Button>
                </Box>
              </Box>
            </motion.div>
          )}
        </Box>
      </motion.div>
    </Box>
  )
}
