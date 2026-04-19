import { FC } from 'react'
import { useParams, Navigate } from 'react-router-dom'
import { Alert, Box, CircularProgress } from '@mui/material'
import { useProfileViewModel } from '../viewmodel/useProfileViewModel'
import { EmployeeProfileView } from './EmployeeProfileView'

export const EmployeeProfileContainer: FC = () => {
  const { id } = useParams<{ id: string }>()
  const vm = useProfileViewModel(id || '')

  if (!id) {
    return <Navigate to="/triage" replace />
  }

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

  return (
    <EmployeeProfileView
      profile={vm.profile}
      allProfiles={vm.profile ? [vm.profile] : []}
      globalSkills={vm.globalSkills}
      dirtyProfile={vm.dirtyProfile}
      onUpdateProfile={vm.updateProfile}
      onSaveProfile={vm.saveProfile}
      onUpdateSkill={vm.updateSkill}
      onSaveSkill={vm.saveSkill}
    />
  )
}
