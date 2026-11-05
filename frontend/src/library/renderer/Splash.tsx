import { useEffect, useState } from 'react'
import { Box, Typography } from '@mui/material'

export interface SplashLetter {
  letter: string
  caption?: string
}

const reducedMotion = (): boolean =>
  typeof window !== 'undefined' && typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

/** Highlights each letter in turn, then calls onDone. Reduced motion shortens the steps. */
export const Splash = ({ brand, tagline, letters, onDone }: { brand: string; tagline: string; letters?: SplashLetter[]; onDone: () => void }) => {
  const items: SplashLetter[] = letters ?? [...brand.toUpperCase()].map((letter) => ({ letter }))
  const [active, setActive] = useState(-1)
  const step = reducedMotion() ? 120 : 600

  useEffect(() => {
    if (active >= items.length) return onDone()
    const t = setTimeout(() => setActive((i) => i + 1), active < 0 ? step : step)
    return () => clearTimeout(t)
  }, [active, items.length, onDone, step])

  return (
    <Box sx={{ minHeight: '100vh', display: 'grid', placeItems: 'center', textAlign: 'center' }} data-testid="splash">
      <Box>
        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
          {items.map((it, i) => (
            <Box key={i} sx={{ transition: reducedMotion() ? 'none' : 'all 300ms', opacity: i <= active ? 1 : 0.25, transform: i === active && !reducedMotion() ? 'scale(1.25)' : 'none' }}>
              <Typography variant="h2" component="span">{it.letter}</Typography>
              {it.caption && <Typography variant="caption" display="block">{it.caption}</Typography>}
            </Box>
          ))}
        </Box>
        <Typography sx={{ mt: 3 }} color="text.secondary">{tagline}</Typography>
      </Box>
    </Box>
  )
}
