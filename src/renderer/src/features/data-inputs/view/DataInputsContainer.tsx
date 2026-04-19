import { FC } from 'react'
import { Alert, Box, CircularProgress } from '@mui/material'
import { useDataInputsViewModel } from '../viewmodel/useDataInputsViewModel'
import { DataInputsListView, DataInputDetailView } from './DataInputsView'

export const DataInputsContainer: FC = () => {
  const vm = useDataInputsViewModel()

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

  const selectedDataInputId = vm.selectedDataInput?.dataInput.uid ?? null

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
        <DataInputsListView
          dataInputs={vm.dataInputs}
          selectedDataInputId={selectedDataInputId}
          onSelectDataInput={vm.selectDataInput}
        />
      </Box>
      <Box sx={{ flex: 1, p: 2, overflow: 'auto' }}>
        <DataInputDetailView
          dataInputWithStatus={vm.selectedDataInput}
          isSaving={vm.isSaving}
          onSaveToVault={vm.saveDataInputToVault}
        />
      </Box>
    </Box>
  )
}
