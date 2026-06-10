import { FC, useEffect, useRef, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { Box, Typography, CircularProgress } from '@mui/material'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import { motion } from 'framer-motion'

const C = {
  bg: '#090B10',
  bar: '#12141A',
  border: 'rgba(255,255,255,0.08)',
  primary: '#5A60F5',
  error: '#ED5F74',
  textPrimary: '#F2F2F3',
  textSecondary: '#8A8F98'
}

export const AppRunnerContainer: FC = () => {
  const navigate = useNavigate()
  const { appId = '' } = useParams<{ appId: string }>()
  const [searchParams] = useSearchParams()
  const appName = searchParams.get('name') ?? appId

  const [status, setStatus] = useState<'loading' | 'running' | 'error'>('loading')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  // Prevents double-launch from React StrictMode's mount→cleanup→remount cycle.
  const launchCalledRef = useRef(false)
  // Mirrors status in a ref so the cleanup closure can read the current value.
  const statusRef = useRef<'loading' | 'running' | 'error'>('loading')
  statusRef.current = status

  useEffect(() => {
    if (!appId) {
      navigate('/home', { replace: true })
      return
    }

    // Already launched on this component instance — StrictMode second invocation.
    if (launchCalledRef.current) return
    launchCalledRef.current = true

    window.api.apps.launchWebview(appId).then((result) => {
      if (result.success) {
        setStatus('running')
      } else if (result.error === 'Launch cancelled by exit request') {
        // StrictMode cleanup called exitWebview while loadFile was in flight.
        // Stay in 'loading' — the launch never actually started from the user's perspective.
      } else {
        setStatus('error')
        setErrorMsg(result.error ?? 'Failed to launch app')
      }
    }).catch((err: unknown) => {
      setStatus('error')
      setErrorMsg(err instanceof Error ? err.message : 'Launch failed')
    })

    const unsubCrash = window.api.apps.onPluginCrashed(({ reason }) => {
      console.warn('[AppRunner] Plugin crashed:', reason, '— navigating home')
      setStatus('error')
      setErrorMsg(`Plugin crashed (${reason}). Returning to home.`)
      setTimeout(() => navigate('/home'), 2000)
    })

    return () => {
      unsubCrash()
      // Only call exitWebview when the app is actually running.
      // If status is still 'loading', this is a StrictMode cleanup — skipping
      // exitWebview lets the in-progress launch complete without cancellation.
      if (statusRef.current === 'running') {
        window.api.apps.exitWebview().catch(() => { /* ignore */ })
      }
    }
  }, [appId, navigate])

  const handleExit = () => {
    window.api.apps.exitWebview().catch(() => {})
    navigate('/home')
  }

  return (
    <Box sx={{ width: '100vw', height: '100vh', bgcolor: C.bg, display: 'flex', flexDirection: 'column' }}>
      {/* Top bar — 52px — visible above the WebContentsView */}
      <Box sx={{
        height: 52,
        flexShrink: 0,
        bgcolor: C.bar,
        borderBottom: `1px solid ${C.border}`,
        display: 'flex',
        alignItems: 'center',
        px: 2,
        gap: 2,
        zIndex: 1
      }}>
        <Box
          onClick={handleExit}
          sx={{
            display: 'flex', alignItems: 'center', gap: 1,
            px: 1.5, py: 0.75,
            bgcolor: 'rgba(255,255,255,0.06)',
            border: `1px solid ${C.border}`,
            borderRadius: 1.5,
            cursor: 'pointer',
            color: C.textPrimary,
            fontSize: 13,
            fontWeight: 600,
            fontFamily: 'Inter, system-ui, sans-serif',
            transition: 'border-color 0.15s, color 0.15s',
            '&:hover': { borderColor: C.primary, color: C.primary }
          }}
        >
          <ArrowBackIcon sx={{ fontSize: 15 }} />
          Exit to Home
        </Box>

        {status === 'running' && (
          <Typography sx={{ fontSize: 13, color: C.textSecondary, fontFamily: 'Inter, system-ui, sans-serif' }}>
            {appName}
          </Typography>
        )}
      </Box>

      {/* Content area — the WebContentsView from main process covers this */}
      <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {status === 'loading' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}
          >
            <CircularProgress size={32} sx={{ color: C.primary }} />
            <Typography sx={{ color: C.textSecondary, fontSize: 14, fontFamily: 'Inter, system-ui, sans-serif' }}>
              Launching {appName}…
            </Typography>
          </motion.div>
        )}

        {status === 'error' && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ textAlign: 'center', padding: 32 }}
          >
            <Typography sx={{ color: C.error, fontSize: 16, fontWeight: 600, mb: 1, fontFamily: 'Inter, system-ui, sans-serif' }}>
              Failed to launch {appName}
            </Typography>
            <Typography sx={{ color: C.textSecondary, fontSize: 13, mb: 3, fontFamily: 'Inter, system-ui, sans-serif' }}>
              {errorMsg}
            </Typography>
            <Box
              onClick={handleExit}
              sx={{
                display: 'inline-flex', px: 3, py: 1,
                bgcolor: C.primary, borderRadius: 1.5,
                color: '#fff', fontWeight: 600, fontSize: 14,
                cursor: 'pointer', fontFamily: 'Inter, system-ui, sans-serif',
                '&:hover': { opacity: 0.88 }
              }}
            >
              Back to Home
            </Box>
          </motion.div>
        )}
      </Box>
    </Box>
  )
}
