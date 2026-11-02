import { FC, useState } from 'react'
import { Box, Typography, IconButton, InputBase, Chip, CircularProgress, Tooltip } from '@mui/material'
import { motion, AnimatePresence } from 'framer-motion'
import AppsIcon from '@mui/icons-material/Apps'
import StorageIcon from '@mui/icons-material/Storage'
import CachedIcon from '@mui/icons-material/Cached'
import LogoutIcon from '@mui/icons-material/Logout'
import SearchIcon from '@mui/icons-material/Search'
import SettingsIcon from '@mui/icons-material/Settings'
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import LaunchIcon from '@mui/icons-material/Launch'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import DownloadIcon from '@mui/icons-material/Download'

export interface AppRecord {
  id: string
  name: string
  cloneUrl: string
  status: string
  isInstalled: boolean
  installPath: string | null
  installedAt: number | null
  version: string | null
}

export interface HomeViewProps {
  employeeName: string
  installedApps: AppRecord[]
  availableApps: AppRecord[]
  isLoading: boolean
  installingAppId: string | null
  launchingAppId: string | null
  uninstallingAppId: string | null
  error: string | null
  onInstall: (app: AppRecord) => void
  onLaunch: (appId: string) => void
  onUninstall: (appId: string) => void
  onLogout: () => void
}

// ── Design tokens ──────────────────────────────────────────────────────────────
const C = {
  bg: '#0d1117',
  sidebar: '#0d1117',
  card: '#161b22',
  cardHover: '#1c2128',
  border: 'rgba(255,255,255,0.08)',
  primary: '#7c6af7',
  primaryAlpha: 'rgba(124,106,247,0.15)',
  success: '#3fb950',
  successAlpha: 'rgba(63,185,80,0.15)',
  warning: '#d29922',
  warningAlpha: 'rgba(210,153,34,0.12)',
  error: '#f85149',
  textPrimary: '#e6edf3',
  textSecondary: '#8b949e',
  textMuted: '#6e7681',
  sidebarActive: 'rgba(124,106,247,0.18)',
  heroGradient: 'linear-gradient(135deg, #161b22 0%, #0d1117 100%)'
}

const SIDEBAR_W = 200
const SIDEBAR_COLLAPSED_W = 56

// ── App icon component (gradient circle with initial) ─────────────────────────
const AppIcon: FC<{ name: string; size?: number }> = ({ name, size = 40 }) => {
  const colors = [
    ['#7c6af7', '#9d8df9'],
    ['#1f6feb', '#388bfd'],
    ['#bf4b8a', '#da7aca'],
    ['#d29922', '#f0b429'],
    ['#3fb950', '#7ce38b']
  ]
  const idx = name.charCodeAt(0) % colors.length
  const [from, to] = colors[idx]
  return (
    <Box
      sx={{
        width: size,
        height: size,
        borderRadius: 1.5,
        background: `linear-gradient(135deg, ${from}, ${to})`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0
      }}
    >
      <Typography sx={{ color: '#fff', fontWeight: 700, fontSize: size * 0.4 }}>
        {name.charAt(0).toUpperCase()}
      </Typography>
    </Box>
  )
}

// ── Sidebar nav item ──────────────────────────────────────────────────────────
const NavItem: FC<{
  icon: React.ReactNode
  label: string
  active?: boolean
  collapsed: boolean
  onClick?: () => void
}> = ({ icon, label, active, collapsed, onClick }) => (
  <Tooltip title={collapsed ? label : ''} placement="right">
    <Box
      onClick={onClick}
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1.5,
        px: collapsed ? 1.5 : 2,
        py: 1,
        mx: 1,
        borderRadius: 1.5,
        cursor: 'pointer',
        bgcolor: active ? C.sidebarActive : 'transparent',
        color: active ? C.primary : C.textSecondary,
        transition: 'all 0.15s ease',
        '&:hover': { bgcolor: active ? C.sidebarActive : 'rgba(255,255,255,0.04)', color: C.textPrimary }
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', flexShrink: 0, fontSize: 20 }}>{icon}</Box>
      {!collapsed && (
        <Typography sx={{ fontSize: 13, fontWeight: active ? 600 : 400, whiteSpace: 'nowrap', overflow: 'hidden' }}>
          {label}
        </Typography>
      )}
    </Box>
  </Tooltip>
)

// ── Installed app card ────────────────────────────────────────────────────────
const InstalledCard: FC<{
  app: AppRecord
  isLaunching: boolean
  isUninstalling: boolean
  isChakra: boolean
  onLaunch: () => void
  onUninstall: () => void
}> = ({ app, isLaunching, isUninstalling, isChakra, onLaunch, onUninstall }) => (
  <motion.div
    layout
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, scale: 0.95 }}
    transition={{ duration: 0.2 }}
  >
    <Box
      sx={{
        bgcolor: C.card,
        border: `1px solid ${C.border}`,
        borderRadius: 2,
        p: 2,
        display: 'flex',
        flexDirection: 'column',
        gap: 1.5,
        transition: 'border-color 0.15s',
        '&:hover': { borderColor: 'rgba(255,255,255,0.15)' }
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <AppIcon name={app.name} />
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography sx={{ color: C.textPrimary, fontWeight: 600, fontSize: 14 }}>{app.name}</Typography>
          <Typography sx={{ color: C.textMuted, fontSize: 12 }}>
            {app.version ? `v${app.version}` : 'installed'}
          </Typography>
        </Box>
      </Box>

      {isChakra ? (
        <Box sx={{ p: 1, bgcolor: 'rgba(255,255,255,0.03)', borderRadius: 1, textAlign: 'center' }}>
          <Typography sx={{ color: C.textMuted, fontSize: 11 }}>Platform runtime</Typography>
          <Typography sx={{ color: C.textMuted, fontSize: 11 }}>— you are here</Typography>
        </Box>
      ) : (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flex: 1 }}>
            <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: C.success }} />
            <Typography sx={{ color: C.success, fontSize: 11, fontWeight: 500 }}>Active</Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 0.5 }}>
            <Box
              onClick={!isLaunching ? onLaunch : undefined}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 0.5,
                px: 1.5,
                py: 0.5,
                borderRadius: 1,
                bgcolor: C.primary,
                cursor: isLaunching ? 'wait' : 'pointer',
                opacity: isLaunching ? 0.7 : 1,
                '&:hover': { bgcolor: '#6c5ae0' },
                transition: 'background-color 0.15s'
              }}
            >
              {isLaunching ? (
                <CircularProgress size={12} sx={{ color: '#fff' }} />
              ) : (
                <LaunchIcon sx={{ fontSize: 12, color: '#fff' }} />
              )}
              <Typography sx={{ color: '#fff', fontSize: 12, fontWeight: 500 }}>Launch</Typography>
            </Box>
            <Tooltip title="Uninstall">
              <IconButton
                size="small"
                onClick={!isUninstalling ? onUninstall : undefined}
                disabled={isUninstalling}
                sx={{ color: C.error, opacity: isUninstalling ? 0.5 : 1, '&:hover': { bgcolor: 'rgba(248,81,73,0.1)' } }}
              >
                {isUninstalling ? <CircularProgress size={14} sx={{ color: C.error }} /> : <DeleteOutlineIcon sx={{ fontSize: 16 }} />}
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
      )}
    </Box>
  </motion.div>
)

// ── Available app card ────────────────────────────────────────────────────────
const AvailableCard: FC<{
  app: AppRecord
  isInstalling: boolean
  onInstall: () => void
}> = ({ app, isInstalling, onInstall }) => (
  <motion.div
    layout
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, scale: 0.95 }}
    transition={{ duration: 0.2 }}
  >
    <Box
      sx={{
        bgcolor: C.card,
        border: `1px solid ${C.border}`,
        borderRadius: 2,
        p: 2,
        display: 'flex',
        flexDirection: 'column',
        gap: 1.5,
        '&:hover': { borderColor: 'rgba(255,255,255,0.15)' },
        transition: 'border-color 0.15s'
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <AppIcon name={app.name} size={36} />
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography sx={{ color: C.textPrimary, fontWeight: 600, fontSize: 14 }}>{app.name}</Typography>
          <Typography sx={{ color: C.textMuted, fontSize: 11, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {app.cloneUrl || 'No repository URL'}
          </Typography>
        </Box>
      </Box>
      <Box
        onClick={!isInstalling ? onInstall : undefined}
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 0.75,
          py: 0.75,
          borderRadius: 1,
          border: `1px solid ${C.border}`,
          cursor: isInstalling ? 'wait' : 'pointer',
          opacity: isInstalling ? 0.7 : 1,
          '&:hover': { bgcolor: 'rgba(255,255,255,0.04)', borderColor: C.primary },
          transition: 'all 0.15s'
        }}
      >
        {isInstalling ? (
          <CircularProgress size={14} sx={{ color: C.primary }} />
        ) : (
          <DownloadIcon sx={{ fontSize: 14, color: C.primary }} />
        )}
        <Typography sx={{ color: isInstalling ? C.textSecondary : C.primary, fontSize: 13, fontWeight: 500 }}>
          {isInstalling ? 'Installing…' : 'Install'}
        </Typography>
      </Box>
    </Box>
  </motion.div>
)

// ── Section label ─────────────────────────────────────────────────────────────
const SectionLabel: FC<{ children: string }> = ({ children }) => (
  <Typography sx={{ fontSize: 11, fontWeight: 600, color: C.textMuted, letterSpacing: '0.08em', textTransform: 'uppercase', mb: 1.5 }}>
    {children}
  </Typography>
)

// ── Main view ─────────────────────────────────────────────────────────────────
export const HomeView: FC<HomeViewProps> = ({
  employeeName,
  installedApps,
  availableApps,
  isLoading,
  installingAppId,
  launchingAppId,
  uninstallingAppId,
  error,
  onInstall,
  onLaunch,
  onUninstall,
  onLogout
}) => {
  const [collapsed, setCollapsed] = useState(false)
  const [search, setSearch] = useState('')

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'

  const filteredInstalled = installedApps.filter(a =>
    a.name.toLowerCase().includes(search.toLowerCase())
  )
  const filteredAvailable = availableApps.filter(a =>
    a.name.toLowerCase().includes(search.toLowerCase())
  )

  const systemHealthy = error === null

  return (
    <Box sx={{ display: 'flex', height: '100vh', bgcolor: C.bg, overflow: 'hidden', fontFamily: 'Inter, system-ui, sans-serif' }}>
      {/* ── Sidebar ── */}
      <Box
        component={motion.div}
        animate={{ width: collapsed ? SIDEBAR_COLLAPSED_W : SIDEBAR_W }}
        transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
        sx={{
          bgcolor: C.sidebar,
          borderRight: `1px solid ${C.border}`,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          flexShrink: 0,
          position: 'relative'
        }}
      >
        {/* Logo */}
        <Box sx={{ px: collapsed ? 1.5 : 2, py: 2, display: 'flex', alignItems: 'center', gap: 1.5, height: 56 }}>
          <Box sx={{
            width: 28, height: 28, borderRadius: '50%',
            background: 'linear-gradient(135deg, #7c6af7, #9d8df9)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
          }}>
            <Typography sx={{ color: '#fff', fontSize: 13, fontWeight: 700 }}>B</Typography>
          </Box>
          {!collapsed && (
            <Typography sx={{ color: C.textPrimary, fontWeight: 700, fontSize: 14, letterSpacing: '-0.01em' }}>
              BAVANS
            </Typography>
          )}
          <Box sx={{ flex: 1 }} />
          <IconButton
            size="small"
            onClick={() => setCollapsed(!collapsed)}
            sx={{ color: C.textMuted, '&:hover': { color: C.textPrimary } }}
          >
            {collapsed ? <ChevronRightIcon sx={{ fontSize: 16 }} /> : <ChevronLeftIcon sx={{ fontSize: 16 }} />}
          </IconButton>
        </Box>

        <Box sx={{ flex: 1, overflow: 'hidden', py: 1 }}>
          {/* PLATFORM */}
          {!collapsed && (
            <Typography sx={{ px: 2, pb: 0.5, fontSize: 10, fontWeight: 600, color: C.textMuted, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              Platform
            </Typography>
          )}
          <NavItem icon={<AppsIcon sx={{ fontSize: 18 }} />} label="Apps" active collapsed={collapsed} />

          <Box sx={{ height: 16 }} />

          {/* STORAGE */}
          {!collapsed && (
            <Typography sx={{ px: 2, pb: 0.5, fontSize: 10, fontWeight: 600, color: C.textMuted, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              Storage
            </Typography>
          )}
          <NavItem icon={<StorageIcon sx={{ fontSize: 18 }} />} label="Virtual Drive" collapsed={collapsed} />
          <NavItem icon={<CachedIcon sx={{ fontSize: 18 }} />} label="Cache" collapsed={collapsed} />

          <Box sx={{ height: 16 }} />

          {/* ACCOUNT */}
          {!collapsed && (
            <Typography sx={{ px: 2, pb: 0.5, fontSize: 10, fontWeight: 600, color: C.textMuted, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              Account
            </Typography>
          )}
          <NavItem icon={<LogoutIcon sx={{ fontSize: 18 }} />} label="Sign Out" collapsed={collapsed} onClick={onLogout} />
        </Box>
      </Box>

      {/* ── Main content ── */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Top bar */}
        <Box sx={{ px: 4, height: 56, display: 'flex', alignItems: 'center', gap: 2, borderBottom: `1px solid ${C.border}` }}>
          <Box sx={{ flex: 1 }} />
          <Box sx={{
            display: 'flex', alignItems: 'center', gap: 1,
            bgcolor: C.card, border: `1px solid ${C.border}`, borderRadius: 1.5,
            px: 1.5, height: 32, width: 220
          }}>
            <SearchIcon sx={{ fontSize: 16, color: C.textMuted }} />
            <InputBase
              placeholder="Search apps..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              sx={{ color: C.textSecondary, fontSize: 13, flex: 1, '& input::placeholder': { color: C.textMuted } }}
            />
          </Box>
          <IconButton size="small" sx={{ color: C.textMuted, '&:hover': { color: C.textPrimary } }}>
            <SettingsIcon sx={{ fontSize: 18 }} />
          </IconButton>
        </Box>

        {/* Scrollable content */}
        <Box sx={{ flex: 1, overflow: 'auto', p: 4 }}>
          {/* Header */}
          <Box sx={{ mb: 4 }}>
            <Typography sx={{ fontSize: 28, fontWeight: 700, color: C.textPrimary, lineHeight: 1.2 }}>
              {greeting}
            </Typography>
            <Typography sx={{ fontSize: 14, color: C.textSecondary, mt: 0.5 }}>
              {employeeName ? `Welcome back, ${employeeName}` : 'Manage your BAVANS application platform'}
            </Typography>
          </Box>

          {/* Status hero */}
          <Box sx={{
            background: C.heroGradient,
            border: `1px solid ${C.border}`,
            borderRadius: 2,
            p: 3,
            mb: 3
          }}>
            <Chip
              label={systemHealthy ? 'SYSTEM HEALTHY' : 'SYSTEM ATTENTION'}
              size="small"
              sx={{
                bgcolor: systemHealthy ? C.successAlpha : C.warningAlpha,
                color: systemHealthy ? C.success : C.warning,
                fontWeight: 600,
                fontSize: 10,
                letterSpacing: '0.08em',
                mb: 1.5,
                height: 22
              }}
            />
            <Typography sx={{ fontSize: 22, fontWeight: 700, color: C.textPrimary, mb: 0.5 }}>
              {systemHealthy ? 'All services operational' : 'Some services need attention'}
            </Typography>
            <Typography sx={{ fontSize: 13, color: C.textSecondary }}>
              {systemHealthy
                ? 'Chakra platform is running normally. Your installed apps are accessible and the vault is mounted.'
                : error}
            </Typography>
          </Box>

          {/* Stats row */}
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mb: 3, maxWidth: 480 }}>
            {[
              { label: 'INSTALLED', count: installedApps.length, sub: 'apps active' },
              { label: 'AVAILABLE', count: availableApps.length, sub: 'apps to install' }
            ].map(s => (
              <Box key={s.label} sx={{
                bgcolor: C.card,
                border: `1px solid ${C.border}`,
                borderRadius: 2,
                p: 2.5
              }}>
                <Typography sx={{ fontSize: 10, fontWeight: 600, color: C.textMuted, letterSpacing: '0.1em', textTransform: 'uppercase', mb: 0.5 }}>
                  {s.label}
                </Typography>
                <Typography sx={{ fontSize: 36, fontWeight: 700, color: C.textPrimary, lineHeight: 1 }}>
                  {isLoading ? '–' : s.count}
                </Typography>
                <Typography sx={{ fontSize: 12, color: C.textSecondary, mt: 0.5 }}>{s.sub}</Typography>
              </Box>
            ))}
          </Box>

          {/* Loading skeleton */}
          {isLoading && (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
              <CircularProgress size={32} sx={{ color: C.primary }} />
            </Box>
          )}

          {!isLoading && (
            <>
              {/* Installed apps */}
              {filteredInstalled.length > 0 && (
                <Box sx={{ mb: 4 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
                    <SectionLabel>Installed Apps</SectionLabel>
                    <Box sx={{ flex: 1 }} />
                    <Typography sx={{ fontSize: 12, color: C.primary, cursor: 'pointer', '&:hover': { color: '#9d8df9' } }}>
                      Manage
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 2 }}>
                    <AnimatePresence>
                      {filteredInstalled.map(app => (
                        <InstalledCard
                          key={app.id}
                          app={app}
                          isLaunching={launchingAppId === app.id}
                          isUninstalling={uninstallingAppId === app.id}
                          isChakra={app.name.toLowerCase() === 'chakra'}
                          onLaunch={() => onLaunch(app.id)}
                          onUninstall={() => onUninstall(app.id)}
                        />
                      ))}
                    </AnimatePresence>
                  </Box>
                </Box>
              )}

              {/* Available apps */}
              {filteredAvailable.length > 0 && (
                <Box>
                  <SectionLabel>Available to Install</SectionLabel>
                  <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 2 }}>
                    <AnimatePresence>
                      {filteredAvailable.map(app => (
                        <AvailableCard
                          key={app.id}
                          app={app}
                          isInstalling={installingAppId === app.id}
                          onInstall={() => onInstall(app)}
                        />
                      ))}
                    </AnimatePresence>
                  </Box>
                </Box>
              )}

              {/* Empty state */}
              {filteredInstalled.length === 0 && filteredAvailable.length === 0 && (
                <Box sx={{ textAlign: 'center', py: 8 }}>
                  {search ? (
                    <>
                      <Typography sx={{ color: C.textSecondary, mb: 1 }}>No apps match "{search}"</Typography>
                      <Typography sx={{ color: C.textMuted, fontSize: 13 }}>Try a different search term.</Typography>
                    </>
                  ) : (
                    <>
                      <AppsIcon sx={{ fontSize: 48, color: C.textMuted, mb: 2 }} />
                      <Typography sx={{ color: C.textSecondary, mb: 1 }}>No apps available</Typography>
                      <Typography sx={{ color: C.textMuted, fontSize: 13 }}>
                        Click the sync button above to load apps from Google Sheets.
                      </Typography>
                    </>
                  )}
                </Box>
              )}
            </>
          )}
        </Box>
      </Box>
    </Box>
  )
}
