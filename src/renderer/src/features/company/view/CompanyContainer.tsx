import { FC } from 'react'
import { Alert, Box, CircularProgress } from '@mui/material'
import { useCompanyViewModel } from '../viewmodel/useCompanyViewModel'
import { CompanyView } from './CompanyView'

interface CompanyContainerProps {
  companyId?: string
}

export const CompanyContainer: FC<CompanyContainerProps> = ({ companyId }) => {
  const vm = useCompanyViewModel(companyId)

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
    <CompanyView
      company={vm.company}
      isLoading={vm.isLoading}
      error={vm.error}
      isDirty={vm.isDirty}
      isSaving={vm.isSaving}
      onUpdateCore={() => {}}
      onSave={vm.saveCompany}
    />
  )
}
