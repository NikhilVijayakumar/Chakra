import { FC } from 'react'
import { Alert, Box, CircularProgress } from '@mui/material'
import { useSkillsViewModel } from '../viewmodel/useSkillsViewModel'
import { SkillsListView, SkillDetailView } from './SkillsView'

export const SkillsContainer: FC = () => {
  const vm = useSkillsViewModel()

  if (vm.isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <CircularProgress size={28} />
      </Box>
    )
  }

  if (vm.error) {
    return <Alert severity="error">{vm.error}</Alert>
  }

  const selectedSkillId = vm.selectedSkill?.skill.id ?? null

  return (
    <Box sx={{ display: 'flex', height: '100%' }}>
      <Box
        sx={{
          width: 300,
          borderRight: '1px solid',
          borderColor: 'divider',
          p: 2,
          overflow: 'auto'
        }}
      >
        <SkillsListView
          skills={vm.skills}
          selectedSkillId={selectedSkillId}
          onSelectSkill={vm.selectSkill}
        />
      </Box>
      <Box sx={{ flex: 1, p: 2, overflow: 'auto' }}>
        <SkillDetailView
          skillWithStatus={vm.selectedSkill}
          isSaving={vm.isSaving}
          onSaveToVault={vm.saveSkillToVault}
        />
      </Box>
    </Box>
  )
}
