import { FC, useEffect, useMemo, useRef, useState } from 'react'
import { Box, Typography, useTheme, keyframes } from '@mui/material'
import { useNavigate } from 'react-router-dom'

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
`

type HeroTheme = 'dark' | 'light'

interface LetterSpec {
  letter: string
  name: string
  concept: string
  zIndex: number
}

const HERO_LETTERS: LetterSpec[] = [
  { letter: 'B', name: 'Bhavana', concept: 'Belief', zIndex: 3 },
  { letter: 'A', name: 'Aadvika', concept: 'Art', zIndex: 4 },
  { letter: 'V', name: 'Vijayakumar', concept: 'Vision', zIndex: 5 },
  { letter: 'A', name: 'Aarradhya', concept: 'Aesthetic', zIndex: 4 },
  { letter: 'N', name: 'Nikhil', concept: 'Narrative', zIndex: 3 },
  { letter: 'S', name: 'Swathy', concept: 'Story', zIndex: 2 }
]

const HERO_STEP_DELAY_MS = 1000
const HERO_INTRO_DELAY_MS = 1000
const HERO_LINGER_DELAY_MS = 500

const getInitialTheme = (): HeroTheme => {
  if (typeof document === 'undefined') {
    return 'dark'
  }

  return document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark'
}

const getHeroStepDelay = (): number => {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return HERO_STEP_DELAY_MS
  }

  return window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 350 : HERO_STEP_DELAY_MS
}

const setDocumentTheme = (theme: HeroTheme): void => {
  if (typeof document === 'undefined') {
    return
  }

  document.documentElement.setAttribute('data-theme', theme)
  localStorage.setItem('darkMode', theme === 'dark' ? 'true' : 'false')
}

const ThemeToggle = ({ theme, onToggle }: { theme: HeroTheme; onToggle: () => void }) => {
  const isDark = theme === 'dark'

  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label="Toggle theme"
      data-testid="hero-theme-toggle"
      style={{
        position: 'fixed',
        top: 24,
        right: 24,
        width: 40,
        height: 40,
        borderRadius: '50%',
        border: '1px solid rgba(255,255,255,0.12)',
        background: isDark ? '#12141A' : '#FFFFFF',
        color: isDark ? '#8A8F98' : '#687076',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        zIndex: 20,
        transition: 'transform 120ms ease, border-color 120ms ease, color 120ms ease'
      }}
    >
      <svg className="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="5" className="si2" style={{ display: isDark ? 'block' : 'none' }} />
        <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" className="sr" style={{ display: isDark ? 'block' : 'none' }} />
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" className="mi" style={{ display: isDark ? 'none' : 'block' }} />
      </svg>
    </button>
  )
}

const HeroLetter = ({
  spec,
  isHovered,
  theme
}: {
  spec: LetterSpec
  isHovered: boolean
  theme: HeroTheme
}) => {
  const isDark = theme === 'dark'

  return (
    <Box
      data-testid={`hero-letter-${spec.letter}-${spec.zIndex}`}
      sx={{
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        zIndex: spec.zIndex,
        transform: isHovered ? 'translateY(-10px)' : 'none',
        transition: 'transform 120ms cubic-bezier(0.12, 0, 0.08, 1)',
        '& .hero-letter': {
          fontSize: { xs: '2.5rem', sm: '4rem', md: '6rem' },
          fontWeight: 900,
          lineHeight: 1,
          letterSpacing: '-0.03em',
          color: isDark ? '#F2F2F3' : '#1A1C23',
          textShadow: isDark ? '0 0 20px rgba(237,237,239,.15)' : 'none',
          background: `linear-gradient(180deg, transparent 0%, ${theme === 'dark' ? 'rgba(90,96,245,0.05)' : 'rgba(90,96,245,0.08)'} 100%)`,
          WebkitBackgroundClip: 'text',
          backgroundClip: 'text',
          transition: 'all 120ms cubic-bezier(0.12, 0, 0.08, 1)'
        },
        '&:hover .hero-letter, &.hover-sim .hero-letter': {
          color: '#5A60F5',
          transform: 'scale(1.1)',
          textShadow: '0 0 30px currentColor'
        },
        '& .name-tooltip-top, & .concept-tooltip-bottom': {
          position: 'absolute',
          left: '50%',
          opacity: 0,
          fontSize: '0.875rem',
          fontWeight: 700,
          letterSpacing: '0.15em',
          textTransform: 'uppercase',
          color: '#5A60F5',
          whiteSpace: 'nowrap',
          pointerEvents: 'none',
          transition: 'all 400ms cubic-bezier(0.4, 0, 0.2, 1)',
          borderRadius: '99px',
          padding: '8px 20px',
          border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.1)',
          background: isDark ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.8)',
          backdropFilter: 'blur(4px)',
          zIndex: 5
        },
        '& .name-tooltip-top': {
          top: '-55px',
          transform: 'translateX(-50%) translateY(20px)'
        },
        '& .concept-tooltip-bottom': {
          bottom: '-55px',
          transform: 'translateX(-50%) translateY(-20px)'
        },
        '&:hover .name-tooltip-top, &:hover .concept-tooltip-bottom, &.hover-sim .name-tooltip-top, &.hover-sim .concept-tooltip-bottom': {
          opacity: 1,
          transform: 'translateX(-50%) translateY(0)'
        }
      }}
      className={isHovered ? 'hover-sim' : undefined}
    >
      <span className="name-tooltip-top">{spec.name}</span>
      <span className="hero-letter">{spec.letter}</span>
      <span className="concept-tooltip-bottom">{spec.concept}</span>
    </Box>
  )
}

const SplashHeroStage: FC<{
  themeMode: HeroTheme
  hoveredIndex: number
  onThemeChange: (theme: HeroTheme) => void
}> = ({ themeMode, hoveredIndex, onThemeChange }) => {
  const theme = useTheme()

  return (
    <Box
      sx={{
        minHeight: '100vh',
        width: '100vw',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        px: 3,
        overflow: 'hidden',
        bgcolor: themeMode === 'dark' ? '#090B10' : '#F7F6F2',
        color: themeMode === 'dark' ? '#F2F2F3' : '#1A1C23',
        position: 'relative',
        transition: 'background 200ms cubic-bezier(0.12, 0, 0.08, 1), color 200ms cubic-bezier(0.12, 0, 0.08, 1)'
      }}
    >
      <Box
        sx={{
          position: 'fixed',
          inset: 0,
          background:
            themeMode === 'dark'
              ? 'radial-gradient(ellipse at 20% 50%, rgba(90,96,245,0.04) 0%, transparent 60%)'
              : 'radial-gradient(ellipse at 20% 50%, rgba(90,96,245,0.05) 0%, transparent 60%)',
          pointerEvents: 'none',
          zIndex: 0
        }}
      />

      <ThemeToggle
        theme={themeMode}
        onToggle={() => {
          const nextTheme = themeMode === 'dark' ? 'light' : 'dark'
          onThemeChange(nextTheme)
          setDocumentTheme(nextTheme)
        }}
      />

      <Typography
        variant="overline"
        sx={{
          position: 'fixed',
          top: 28,
          left: '50%',
          transform: 'translateX(-50%)',
          fontSize: '0.6875rem',
          fontWeight: 600,
          letterSpacing: '0.2em',
          color: theme.palette.text.secondary,
          opacity: 0.85,
          zIndex: 10,
          textTransform: 'uppercase'
        }}
      >
        CHAKRA PLATFORM
      </Typography>

      <Box
        sx={{
          display: 'flex',
          gap: { xs: 1, sm: 1.5, md: 2 },
          alignItems: 'center',
          flexWrap: 'wrap',
          justifyContent: 'center',
          opacity: 0,
          animation: `${fadeIn} 600ms cubic-bezier(0.16, 1, 0.3, 1) forwards`
        }}
      >
        {HERO_LETTERS.map((spec, index) => (
          <HeroLetter key={`${spec.letter}-${index}`} spec={spec} isHovered={hoveredIndex === index} theme={themeMode} />
        ))}
      </Box>
    </Box>
  )
}

export const SplashContainerOverride: FC = () => {
  const navigate = useNavigate()
  const [themeMode, setThemeMode] = useState<HeroTheme>(getInitialTheme())
  const [hoveredIndex, setHoveredIndex] = useState(0)
  const hasStartedRef = useRef(false)
  const stepDelayMs = useMemo(() => getHeroStepDelay(), [])

  const handleThemeChange = (newTheme: HeroTheme) => {
    setThemeMode(newTheme)
  }

  useEffect(() => {
    setDocumentTheme(themeMode)
  }, [themeMode])

  useEffect(() => {
    if (hasStartedRef.current) {
      return
    }

    hasStartedRef.current = true

    let cancelled = false
    let currentTimer: number | null = null

    const startSequence = () => {
      let index = 0

      const runStep = () => {
        if (cancelled) {
          return
        }

        setHoveredIndex(index)
        index += 1

        if (index >= HERO_LETTERS.length) {
          currentTimer = window.setTimeout(() => {
            if (cancelled) {
              return
            }

            navigate('/boot', { replace: true })
          }, HERO_LINGER_DELAY_MS)
          return
        }

        currentTimer = window.setTimeout(runStep, stepDelayMs)
      }

      runStep()
    }

    currentTimer = window.setTimeout(startSequence, HERO_INTRO_DELAY_MS)

    return () => {
      cancelled = true
      if (currentTimer) {
        window.clearTimeout(currentTimer)
      }
      hasStartedRef.current = false
    }
  }, [navigate, stepDelayMs])

  return <SplashHeroStage themeMode={themeMode} hoveredIndex={hoveredIndex} onThemeChange={handleThemeChange} />
}