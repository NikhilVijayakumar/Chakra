import { FC } from 'react'
import { Box, Typography, Button, TextField, useTheme as useMuiTheme } from '@mui/material'
import { useLanguage } from 'astra'
import { spacing } from 'astra'
import { TriageItem, TriageMemoryHit } from '../repo/TriageRepo'

interface TriageViewProps {
  items: TriageItem[] | null
  memoryHits: TriageMemoryHit[] | null
  memoryQuery: string
  isMemorySearching: boolean
  onMemoryQueryChange: (query: string) => void
  onSearchMemory: (query: string) => void
  onAction: (itemId: string, action: 'ANALYZE' | 'CLEAR') => void
  isApplyingAction: boolean
}

export const TriageView: FC<TriageViewProps> = ({
  items,
  memoryHits,
  memoryQuery,
  isMemorySearching,
  onMemoryQueryChange,
  onSearchMemory,
  onAction,
  isApplyingAction
}) => {
  const muiTheme = useMuiTheme()
  const { literal } = useLanguage()

  return (
    <Box sx={{ p: spacing.xl, maxWidth: '1000px', mx: 'auto' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: spacing.xl }}>
        <Typography variant="h3" sx={{ color: muiTheme.palette.text.primary, flexGrow: 1 }}>
          {literal['nav.triage']}
        </Typography>
        <Typography variant="monoCaption" sx={{ color: muiTheme.palette.text.secondary }}>
          {items?.length || 0} {literal['triage.enclavesActive']}
        </Typography>
      </Box>

      <Box
        sx={{
          border: `1px solid ${muiTheme.palette.divider}`,
          borderRadius: spacing.xs,
          backgroundColor: muiTheme.palette.background.paper,
          p: spacing.md,
          mb: spacing.lg
        }}
      >
        <Box sx={{ display: 'flex', gap: spacing.sm }}>
          <TextField
            value={memoryQuery}
            onChange={(event) => onMemoryQueryChange(event.target.value)}
            size="small"
            fullWidth
            placeholder={literal['triage.searchPlaceholder']}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                onSearchMemory(memoryQuery)
              }
            }}
          />
          <Button
            size="small"
            variant="outlined"
            onClick={() => onSearchMemory(memoryQuery)}
            disabled={isMemorySearching || !memoryQuery.trim()}
          >
            {literal['triage.search']}
          </Button>
        </Box>

        {!!memoryHits && (
          <Box sx={{ mt: spacing.sm }}>
            {memoryHits.length === 0 ? (
              <Typography variant="caption" sx={{ color: muiTheme.palette.text.secondary }}>
                {literal['triage.noRelatedMemory']}
              </Typography>
            ) : (
              memoryHits.map((hit) => (
                <Box
                  key={hit.chunkId}
                  sx={{ py: spacing.xs, borderTop: `1px solid ${muiTheme.palette.divider}` }}
                >
                  <Typography variant="body2Bold" sx={{ color: muiTheme.palette.text.primary }}>
                    {hit.title}
                  </Typography>
                  <Typography variant="caption" sx={{ color: muiTheme.palette.text.secondary }}>
                    {hit.relativePath} | {hit.classification} | score {hit.score.toFixed(2)}
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{ color: muiTheme.palette.text.secondary, display: 'block' }}
                  >
                    {hit.excerpt}
                  </Typography>
                </Box>
              ))
            )}
          </Box>
        )}
      </Box>

      {/* Linear Style Data Table Container */}
      <Box
        sx={{
          border: `1px solid ${muiTheme.palette.divider}`,
          borderRadius: spacing.xs,
          backgroundColor: muiTheme.palette.background.paper,
          overflow: 'hidden'
        }}
      >
        {items?.map((item, index) => (
          <Box
            key={item.id}
            sx={{
              display: 'flex',
              alignItems: 'center',
              p: spacing.md,
              borderBottom:
                index === items.length - 1 ? 'none' : `1px solid ${muiTheme.palette.divider}`,
              '&:hover': { backgroundColor: muiTheme.palette.action.hover, cursor: 'pointer' }
            }}
          >
            <Typography
              variant="monoBody"
              sx={{ width: '100px', color: muiTheme.palette.text.secondary }}
            >
              {item.id}
            </Typography>
            <Box sx={{ flexGrow: 1 }}>
              <Typography variant="body2Medium" sx={{ color: muiTheme.palette.text.primary }}>
                {item.topic}
              </Typography>
              <Typography variant="caption" sx={{ color: muiTheme.palette.text.secondary }}>
                {item.source}
              </Typography>
            </Box>
            <Box
              sx={{
                px: spacing.sm,
                py: spacing.internal,
                borderRadius: spacing.internal,
                backgroundColor:
                  item.status === 'PENDING'
                    ? muiTheme.palette.warning.dark
                    : item.status === 'CLEARED'
                      ? muiTheme.palette.success.dark
                      : muiTheme.palette.primary.dark,
                opacity: 0.8
              }}
            >
              <Typography variant="micro" sx={{ color: muiTheme.palette.common.white }}>
                {item.status}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: spacing.sm, ml: spacing.md }}>
              <Button
                size="small"
                variant="outlined"
                disabled={isApplyingAction || item.status === 'ANALYSIS'}
                onClick={() => onAction(item.id, 'ANALYZE')}
              >
                {literal['triage.analyze']}
              </Button>
              <Button
                size="small"
                variant="contained"
                disabled={isApplyingAction || item.status === 'CLEARED'}
                onClick={() => onAction(item.id, 'CLEAR')}
              >
                {literal['triage.clear']}
              </Button>
            </Box>
          </Box>
        ))}
      </Box>
    </Box>
  )
}
