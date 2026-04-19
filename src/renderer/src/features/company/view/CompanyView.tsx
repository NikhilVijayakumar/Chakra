import { FC, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Snackbar,
  Typography,
  Paper,
  Divider,
  Chip
} from '@mui/material'
import { spacing } from 'astra'
import type { CompanyData, CompanyCore } from '../repo/CompanyRepo'

interface CompanyViewProps {
  company: CompanyData | null
  isLoading: boolean
  error: string | null
  isDirty: boolean
  isSaving: boolean
  onUpdateCore: (updates: Partial<CompanyCore>) => void
  onSave: () => Promise<void>
}

export const CompanyView: FC<CompanyViewProps> = ({
  company,
  isLoading,
  error,
  isDirty,
  isSaving,
  onUpdateCore: _onUpdateCore,
  onSave
}) => {
  const [isEditMode, setIsEditMode] = useState(false)
  const [banner, setBanner] = useState<{ severity: 'success' | 'error'; message: string } | null>(
    null
  )

  const handleSave = async () => {
    await onSave()
    setBanner({ severity: 'success', message: 'Company saved to vault' })
    setIsEditMode(false)
  }

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <CircularProgress />
      </Box>
    )
  }

  if (error) {
    return (
      <Box sx={{ p: spacing.xl }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    )
  }

  if (!company) {
    return (
      <Box sx={{ p: spacing.xl }}>
        <Typography>No company data found</Typography>
      </Box>
    )
  }

  const { core } = company

  return (
    <Box sx={{ p: spacing.xl, display: 'flex', flexDirection: 'column', gap: spacing.md }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4">Company</Typography>
        <Box sx={{ display: 'flex', gap: spacing.sm }}>
          {!isEditMode ? (
            <Button variant="outlined" onClick={() => setIsEditMode(true)}>
              Edit
            </Button>
          ) : (
            <>
              <Button variant="outlined" onClick={() => setIsEditMode(false)} disabled={isSaving}>
                Cancel
              </Button>
              <Button variant="contained" onClick={handleSave} disabled={isSaving}>
                {isSaving ? <CircularProgress size={18} color="inherit" /> : 'Save to Vault'}
              </Button>
            </>
          )}
        </Box>
      </Box>

      {isDirty && isEditMode && <Alert severity="warning">You have unsaved changes</Alert>}

      <Paper sx={{ p: spacing.lg, display: 'flex', flexDirection: 'column', gap: spacing.md }}>
        <Typography variant="h6">Identity</Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: spacing.xs }}>
          <Typography variant="body2" color="text.secondary">
            Name
          </Typography>
          <Typography>{core.identity.name}</Typography>
        </Box>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: spacing.xs }}>
          <Typography variant="body2" color="text.secondary">
            Type
          </Typography>
          <Typography>{core.identity.type}</Typography>
        </Box>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: spacing.xs }}>
          <Typography variant="body2" color="text.secondary">
            Foundation
          </Typography>
          <Typography>{core.identity.foundation}</Typography>
        </Box>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: spacing.xs }}>
          <Typography variant="body2" color="text.secondary">
            Philosophy
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: spacing.xs }}>
            {core.identity.philosophy.map((item, idx) => (
              <Chip key={idx} label={item} size="small" variant="outlined" />
            ))}
          </Box>
        </Box>
      </Paper>

      <Paper sx={{ p: spacing.lg, display: 'flex', flexDirection: 'column', gap: spacing.md }}>
        <Typography variant="h6">Vision</Typography>
        <Typography>{core.vision}</Typography>
      </Paper>

      <Paper sx={{ p: spacing.lg, display: 'flex', flexDirection: 'column', gap: spacing.md }}>
        <Typography variant="h6">Core Values</Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: spacing.xs }}>
          {core.core_values.map((value, idx) => (
            <Chip key={idx} label={value} size="small" />
          ))}
        </Box>
      </Paper>

      <Paper sx={{ p: spacing.lg, display: 'flex', flexDirection: 'column', gap: spacing.md }}>
        <Typography variant="h6">AI Governance Model</Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: spacing.sm }}>
          <Box sx={{ display: 'flex', gap: spacing.xs }}>
            <Typography variant="body2" color="text.secondary">
              AI Role:
            </Typography>
            <Typography>{core.ai_governance_model.role_definition.ai}</Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: spacing.xs }}>
            <Typography variant="body2" color="text.secondary">
              Human Role:
            </Typography>
            <Typography>{core.ai_governance_model.role_definition.human}</Typography>
          </Box>
          <Divider />
          <Typography variant="body2" color="text.secondary">
            AI Can Assist:
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: spacing.xs }}>
            {core.ai_governance_model.value_boundaries.ai_can_assist.map((item, idx) => (
              <Chip key={idx} label={item} size="small" variant="outlined" />
            ))}
          </Box>
          <Typography variant="body2" color="text.secondary">
            Human Only Control:
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: spacing.xs }}>
            {core.ai_governance_model.value_boundaries.human_only_control.map((item, idx) => (
              <Chip key={idx} label={item} size="small" variant="outlined" />
            ))}
          </Box>
        </Box>
      </Paper>

      <Paper sx={{ p: spacing.lg, display: 'flex', flexDirection: 'column', gap: spacing.md }}>
        <Typography variant="h6">Global Non-Negotiables</Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: spacing.xs }}>
          {core.global_non_negotiables.map((item, idx) => (
            <Box key={idx} sx={{ display: 'flex', alignItems: 'center', gap: spacing.xs }}>
              <Typography color="primary">•</Typography>
              <Typography>{item}</Typography>
            </Box>
          ))}
        </Box>
      </Paper>

      {core.website && core.website.length > 0 && (
        <Paper sx={{ p: spacing.lg, display: 'flex', flexDirection: 'column', gap: spacing.md }}>
          <Typography variant="h6">Website</Typography>
          <Box sx={{ display: 'flex', gap: spacing.sm }}>
            {core.website.map((url, idx) => (
              <Typography key={idx} color="primary" sx={{ textDecoration: 'underline' }}>
                {url}
              </Typography>
            ))}
          </Box>
        </Paper>
      )}

      <Snackbar open={Boolean(banner)} autoHideDuration={2600} onClose={() => setBanner(null)}>
        <Alert severity={banner?.severity ?? 'success'} onClose={() => setBanner(null)}>
          {banner?.message ?? ''}
        </Alert>
      </Snackbar>
    </Box>
  )
}
