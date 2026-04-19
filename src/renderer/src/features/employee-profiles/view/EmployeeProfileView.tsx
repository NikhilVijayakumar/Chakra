import { FC, useState } from 'react'
import { Alert, Box, Button, CircularProgress, Snackbar, Typography } from '@mui/material'
import { useNavigate } from 'react-router-dom'
import { useLanguage } from 'astra'
import { spacing } from 'astra'
import { DynamicProfileRenderer } from 'prana/ui/components/DynamicProfileRenderer'
import type { LifecycleGlobalSkill, LifecycleProfileDraft } from 'prana/ui/state/LifecycleProvider'

interface EmployeeProfileViewProps {
  profile: LifecycleProfileDraft | null
  allProfiles: LifecycleProfileDraft[]
  globalSkills: LifecycleGlobalSkill[]
  dirtyProfile: boolean
  onUpdateProfile: (patch: Partial<LifecycleProfileDraft>) => void
  onSaveProfile: () => Promise<{ success: boolean; error?: string }>
  onUpdateSkill: (skillId: string, markdown: string) => void
  onSaveSkill: (skillId: string) => Promise<{ success: boolean; error?: string }>
}

export const EmployeeProfileView: FC<EmployeeProfileViewProps> = ({
  profile,
  allProfiles,
  globalSkills,
  dirtyProfile,
  onUpdateProfile,
  onSaveProfile,
  onUpdateSkill,
  onSaveSkill
}) => {
  const { literal } = useLanguage()
  const navigate = useNavigate()
  const [isEditMode, setIsEditMode] = useState<boolean>(false)
  const [isSaving, setIsSaving] = useState<boolean>(false)
  const [banner, setBanner] = useState<{ severity: 'success' | 'error'; message: string } | null>(
    null
  )

  if (!profile) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <Typography variant="body2">{literal['profile.notFound']}</Typography>
      </Box>
    )
  }

  const activeSkills = globalSkills.filter((entry) => profile.skills.includes(entry.id))

  const handleSaveProfile = async () => {
    setIsSaving(true)
    const result = await onSaveProfile()
    setIsSaving(false)

    if (result.success) {
      setIsEditMode(false)
      setBanner({ severity: 'success', message: literal['lifecycle.saveSuccess'] })
      return
    }

    setBanner({ severity: 'error', message: result.error ?? literal['lifecycle.saveFailed'] })
  }

  const handleSaveSkill = async (skillId: string) => {
    const result = await onSaveSkill(skillId)
    if (result.success) {
      setBanner({ severity: 'success', message: literal['lifecycle.saveSuccess'] })
      return
    }

    setBanner({ severity: 'error', message: result.error ?? literal['lifecycle.saveFailed'] })
  }

  return (
    <Box sx={{ p: spacing.xl, display: 'flex', flexDirection: 'column', gap: spacing.md }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4">{profile.name}</Typography>
        <Box sx={{ display: 'flex', gap: spacing.sm }}>
          {!isEditMode ? (
            <Button variant="outlined" onClick={() => setIsEditMode(true)}>
              {literal['global.edit']}
            </Button>
          ) : (
            <>
              <Button variant="outlined" onClick={() => setIsEditMode(false)} disabled={isSaving}>
                {literal['global.cancel']}
              </Button>
              <Button variant="contained" onClick={handleSaveProfile} disabled={isSaving}>
                {isSaving ? <CircularProgress size={18} color="inherit" /> : literal['global.save']}
              </Button>
            </>
          )}
        </Box>
      </Box>

      {dirtyProfile && isEditMode && (
        <Alert severity="warning">{literal['lifecycle.unsavedChanges']}</Alert>
      )}

      <DynamicProfileRenderer
        mode={isEditMode ? 'EDIT' : 'VIEW'}
        profile={profile}
        profiles={allProfiles}
        globalSkills={globalSkills}
        onProfileChange={onUpdateProfile}
        onGlobalSkillChange={onUpdateSkill}
        onOpenRegistry={() => navigate('/settings/registry')}
      />

      {isEditMode && activeSkills.length > 0 && (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: spacing.sm }}>
          {activeSkills.map((skill) => (
            <Button
              key={skill.id}
              size="small"
              variant="text"
              onClick={() => void handleSaveSkill(skill.id)}
            >
              {literal['profile.saveSkill']} {skill.title}
            </Button>
          ))}
        </Box>
      )}

      <Snackbar open={Boolean(banner)} autoHideDuration={2600} onClose={() => setBanner(null)}>
        <Alert severity={banner?.severity ?? 'success'} onClose={() => setBanner(null)}>
          {banner?.message ?? ''}
        </Alert>
      </Snackbar>
    </Box>
  )
}
