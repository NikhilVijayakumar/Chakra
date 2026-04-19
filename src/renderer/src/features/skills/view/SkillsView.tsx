import { FC, useState } from 'react'
import {
  Box,
  CircularProgress,
  Typography,
  Paper,
  List,
  ListItemButton,
  ListItemText,
  Chip,
  Button,
  Snackbar,
  Alert
} from '@mui/material'
import { spacing } from 'astra'
import type { SkillWithStatus, SkillDoc } from '../repo/SkillsRepo'

interface SkillsListViewProps {
  skills: SkillWithStatus[]
  selectedSkillId: string | null
  onSelectSkill: (skill: SkillWithStatus) => void
}

export const SkillsListView: FC<SkillsListViewProps> = ({
  skills,
  selectedSkillId,
  onSelectSkill
}) => {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: spacing.sm }}>
      <Typography variant="h6">Skills</Typography>
      <List sx={{ p: 0 }}>
        {skills.map((skillWithStatus) => (
          <ListItemButton
            key={skillWithStatus.skill.id}
            selected={selectedSkillId === skillWithStatus.skill.id}
            onClick={() => onSelectSkill(skillWithStatus)}
            sx={{ borderRadius: 1, mb: 0.5 }}
          >
            <ListItemText
              primary={
                <Box
                  sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                >
                  <Typography variant="body1">{skillWithStatus.skill.title}</Typography>
                  {skillWithStatus.syncStatus === 'SYNCED' && (
                    <Chip label="In Vault" size="small" color="success" variant="outlined" />
                  )}
                  {skillWithStatus.syncStatus === 'NEW' && (
                    <Chip label="New" size="small" color="warning" variant="outlined" />
                  )}
                </Box>
              }
              secondary={
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                  {skillWithStatus.skill.tags.slice(0, 3).map((tag, idx) => (
                    <Chip
                      key={idx}
                      label={tag}
                      size="small"
                      variant="outlined"
                      sx={{ height: 20 }}
                    />
                  ))}
                </Box>
              }
            />
          </ListItemButton>
        ))}
      </List>
    </Box>
  )
}

interface SkillDetailViewProps {
  skillWithStatus: SkillWithStatus | null
  isSaving: boolean
  onSaveToVault: (skill: SkillDoc) => Promise<void>
}

export const SkillDetailView: FC<SkillDetailViewProps> = ({
  skillWithStatus,
  isSaving,
  onSaveToVault
}) => {
  const [banner, setBanner] = useState<{ severity: 'success' | 'error'; message: string } | null>(
    null
  )

  if (!skillWithStatus) {
    return (
      <Box sx={{ p: spacing.xl }}>
        <Typography color="text.secondary">Select a skill to view details</Typography>
      </Box>
    )
  }

  const { skill, syncStatus } = skillWithStatus

  const handleSaveToVault = async () => {
    await onSaveToVault(skill)
    setBanner({ severity: 'success', message: 'Skill saved to vault' })
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: spacing.md }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h5">{skill.title}</Typography>
        <Box sx={{ display: 'flex', gap: spacing.sm, alignItems: 'center' }}>
          {syncStatus === 'SYNCED' ? (
            <Chip label="In Vault" color="success" variant="outlined" />
          ) : syncStatus === 'NEW' ? (
            <Chip label="New" color="warning" variant="outlined" />
          ) : (
            <Button variant="contained" onClick={handleSaveToVault} disabled={isSaving}>
              {isSaving ? <CircularProgress size={18} color="inherit" /> : 'Save to Vault'}
            </Button>
          )}
        </Box>
      </Box>

      <Paper sx={{ p: spacing.md }}>
        <Typography variant="subtitle2" color="text.secondary">
          Tags
        </Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: spacing.xs }}>
          {skill.tags.map((tag, idx) => (
            <Chip key={idx} label={tag} size="small" variant="outlined" />
          ))}
        </Box>
      </Paper>

      <Paper sx={{ p: spacing.md }}>
        <Typography variant="subtitle2" color="text.secondary">
          Content
        </Typography>
        <Typography sx={{ whiteSpace: 'pre-wrap' }}>{skill.content}</Typography>
      </Paper>

      <Paper sx={{ p: spacing.md }}>
        <Typography variant="subtitle2" color="text.secondary">
          Source
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {skill.sourceFile}
        </Typography>
      </Paper>

      <Snackbar open={Boolean(banner)} autoHideDuration={2600} onClose={() => setBanner(null)}>
        <Alert severity={banner?.severity ?? 'success'} onClose={() => setBanner(null)}>
          {banner?.message ?? ''}
        </Alert>
      </Snackbar>
    </Box>
  )
}
