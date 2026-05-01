import { FC, useState } from 'react'
import {
  Box,
  Card,
  CardContent,
  CardActions,
  Grid,
  Typography,
  Button,
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  useTheme,
  useMediaQuery,
  IconButton,
  AppBar,
  Toolbar
} from '@mui/material'
import { motion } from 'framer-motion'
import MenuIcon from '@mui/icons-material/Menu'
import DashboardIcon from '@mui/icons-material/Dashboard'
import StorageIcon from '@mui/icons-material/Storage'
import SettingsIcon from '@mui/icons-material/Settings'
import LogoutIcon from '@mui/icons-material/Logout'
import AddIcon from '@mui/icons-material/Add'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import ErrorIcon from '@mui/icons-material/Error'
import CloudSyncIcon from '@mui/icons-material/CloudSync'

export interface AppItem {
  id: string
  name: string
  description: string
  status: 'installed' | 'installing' | 'error'
  version: string
  lastUpdated?: Date
  actions?: {
    label: string
    onClick: () => void
  }[]
}

export interface HomeViewProps {
  apps: AppItem[]
  virtualDriveSize: number
  virtualDriveUsed: number
  isLoading: boolean
  onInstallApp: (appId: string) => void
  onOpenApp: (appId: string) => void
  onManageVirtualDrive: () => void
  onSettings: () => void
  onLogout: () => void
  onNavigate: (section: string) => void
  currentSection: string
}

const DRAWER_WIDTH = 280

/**
 * HomeView - Dashboard Home screen
 * 
 * Features:
 * - Sidebar navigation
 * - App grid with status indicators
 * - Virtual drive usage indicator
 * - Install new app button
 * - Settings and logout
 * - Mobile responsive drawer
 */
export const HomeView: FC<HomeViewProps> = ({
  apps,
  virtualDriveSize,
  virtualDriveUsed,
  isLoading,
  onInstallApp,
  onOpenApp,
  onManageVirtualDrive,
  onSettings,
  onLogout,
  onNavigate,
  currentSection
}) => {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  const [drawerOpen, setDrawerOpen] = useState(false)

  const usagePercent = virtualDriveSize > 0 ? (virtualDriveUsed / virtualDriveSize) * 100 : 0

  const navigationItems = [
    { id: 'dashboard', label: 'Dashboard', icon: DashboardIcon },
    { id: 'virtual-drive', label: 'Virtual Drive', icon: StorageIcon },
    { id: 'settings', label: 'Settings', icon: SettingsIcon }
  ]

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'installed':
        return <CheckCircleIcon sx={{ color: theme.palette.success.main }} />
      case 'installing':
        return <CloudSyncIcon sx={{ color: theme.palette.info.main, animation: 'spin 1s linear infinite' }} />
      case 'error':
        return <ErrorIcon sx={{ color: theme.palette.error.main }} />
      default:
        return null
    }
  }

  const sidebar = (
    <Box sx={{ width: DRAWER_WIDTH, display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Box sx={{ p: 2 }}>
        <Typography variant="h6" sx={{ fontWeight: 700, letterSpacing: '-0.02em' }}>
          BAVANS · Chakra
        </Typography>
      </Box>
      <Divider />

      <List sx={{ flex: 1 }} component="nav">
        {navigationItems.map((item) => (
          <ListItemButton
            key={item.id}
            component="li"
            selected={currentSection === item.id}
            onClick={() => {
              onNavigate(item.id)
              if (isMobile) setDrawerOpen(false)
            }}
            sx={{
              borderLeft: currentSection === item.id ? `4px solid ${theme.palette.primary.main}` : 'none',
              pl: currentSection === item.id ? 1 : 2
            }}
          >
            <ListItemIcon>
              <item.icon />
            </ListItemIcon>
            <ListItemText primary={item.label} />
          </ListItemButton>
        ))}
      </List>

      <Divider />

      <Box sx={{ p: 2 }}>
        <Button
          variant="outlined"
          fullWidth
          startIcon={<LogoutIcon />}
          onClick={() => {
            onLogout()
            if (isMobile) setDrawerOpen(false)
          }}
          sx={{ textTransform: 'none' }}
        >
          Sign Out
        </Button>
      </Box>
    </Box>
  )

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: theme.palette.background.default }}>
      {/* Mobile App Bar */}
      {isMobile && (
        <AppBar position="fixed">
          <Toolbar>
            <IconButton
              edge="start"
              color="inherit"
              onClick={() => setDrawerOpen(true)}
            >
              <MenuIcon />
            </IconButton>
            <Typography variant="h6" sx={{ flex: 1, ml: 2 }}>
              Chakra
            </Typography>
          </Toolbar>
        </AppBar>
      )}

      {/* Sidebar */}
      {isMobile ? (
        <Drawer
          anchor="left"
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
        >
          {sidebar}
        </Drawer>
      ) : (
        <Box
          sx={{
            width: DRAWER_WIDTH,
            bgcolor: theme.palette.background.paper,
            borderRight: `1px solid ${theme.palette.divider}`,
            display: { xs: 'none', md: 'flex' },
            flexDirection: 'column'
          }}
        >
          {sidebar}
        </Box>
      )}

      {/* Main Content */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {isMobile && <Box sx={{ height: 64 }} />}

        <Box sx={{ p: { xs: 2, md: 4 }, overflow: 'auto', flex: 1 }}>
          {currentSection === 'dashboard' && (
            <>
              {/* Welcome Header */}
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Box sx={{ mb: 4 }}>
                  <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
                    Welcome back
                  </Typography>
                  <Typography sx={{ color: theme.palette.text.secondary }}>
                    Manage your applications and virtual drive
                  </Typography>
                </Box>
              </motion.div>

              {/* Virtual Drive Status */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.1 }}
              >
                <Card sx={{ mb: 4 }}>
                  <CardContent>
                    <Typography variant="subtitle2" sx={{ mb: 2 }}>
                      Virtual Drive Usage
                    </Typography>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2">{(virtualDriveUsed / 1024 / 1024 / 1024).toFixed(2)} GB</Typography>
                      <Typography variant="body2">{usagePercent.toFixed(1)}%</Typography>
                    </Box>
                    <Box
                      sx={{
                        height: 8,
                        borderRadius: 1,
                        bgcolor: theme.palette.action.disabledBackground,
                        overflow: 'hidden'
                      }}
                    >
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${usagePercent}%` }}
                        transition={{ duration: 1, ease: 'easeOut' }}
                        style={{
                          height: '100%',
                          background: usagePercent > 90
                            ? theme.palette.error.main
                            : usagePercent > 70
                            ? theme.palette.warning.main
                            : theme.palette.primary.main
                        }}
                      />
                    </Box>
                  </CardContent>
                  <CardActions>
                    <Button
                      size="small"
                      onClick={onManageVirtualDrive}
                      sx={{ textTransform: 'none' }}
                    >
                      Manage Storage
                    </Button>
                  </CardActions>
                </Card>
              </motion.div>

              {/* Apps Grid */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.2 }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Installed Applications
                  </Typography>
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => onNavigate('install')}
                    sx={{ textTransform: 'none' }}
                  >
                    Install App
                  </Button>
                </Box>

                <Grid container spacing={2}>
                  {apps.map((app, index) => (
                    <motion.div
                      key={app.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: 0.05 * index }}
                      style={{ width: '100%' }}
                    >
                      <Grid size={{ xs: 12, sm: 6, md: 4 }} sx={{ width: '100%' }}>
                        <Card
                          sx={{
                            height: '100%',
                            display: 'flex',
                            flexDirection: 'column',
                            transition: 'all 0.2s ease',
                            '&:hover': {
                              boxShadow: theme.shadows[4],
                              transform: 'translateY(-2px)'
                            }
                          }}
                        >
                          <CardContent sx={{ flex: 1 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                                {app.name}
                              </Typography>
                              {getStatusIcon(app.status)}
                            </Box>
                            <Typography variant="body2" sx={{ color: theme.palette.text.secondary, mb: 2 }}>
                              {app.description}
                            </Typography>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                                v{app.version}
                              </Typography>
                              {app.lastUpdated && (
                                <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                                  {new Date(app.lastUpdated).toLocaleDateString()}
                                </Typography>
                              )}
                            </Box>
                          </CardContent>
                          <CardActions>
                            <Button
                              size="small"
                              disabled={app.status !== 'installed' || isLoading}
                              onClick={() => onOpenApp(app.id)}
                              sx={{ textTransform: 'none' }}
                            >
                              Open
                            </Button>
                            {app.status === 'error' && (
                              <Button
                                size="small"
                                onClick={() => onInstallApp(app.id)}
                                sx={{ textTransform: 'none' }}
                              >
                                Retry
                              </Button>
                            )}
                          </CardActions>
                        </Card>
                      </Grid>
                    </motion.div>
                  ))}
                </Grid>
              </motion.div>
            </>
          )}

          {currentSection === 'virtual-drive' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              <Typography variant="h4" sx={{ fontWeight: 700, mb: 2 }}>
                Virtual Drive
              </Typography>
              <Typography sx={{ color: theme.palette.text.secondary }}>
                Virtual drive management coming soon
              </Typography>
            </motion.div>
          )}

          {currentSection === 'settings' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              <Typography variant="h4" sx={{ fontWeight: 700, mb: 2 }}>
                Settings
              </Typography>
              <Button variant="contained" onClick={onSettings} sx={{ textTransform: 'none' }}>
                Configure Settings
              </Button>
            </motion.div>
          )}
        </Box>
      </Box>
    </Box>
  )
}
