import { FC } from 'react'
import { Alert, Box, CircularProgress } from '@mui/material'
import { useProtocolsViewModel } from '../viewmodel/useProtocolsViewModel'
import { ProtocolsListView, ProtocolDetailView } from './ProtocolsView'

export const ProtocolsContainer: FC = () => {
  const vm = useProtocolsViewModel()

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

  const selectedProtocolId = vm.selectedProtocol?.protocol.id ?? null

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
        <ProtocolsListView
          protocols={vm.protocols}
          selectedProtocolId={selectedProtocolId}
          onSelectProtocol={vm.selectProtocol}
        />
      </Box>
      <Box sx={{ flex: 1, p: 2, overflow: 'auto' }}>
        <ProtocolDetailView
          protocolWithStatus={vm.selectedProtocol}
          isSaving={vm.isSaving}
          onSaveToVault={vm.saveProtocolToVault}
        />
      </Box>
    </Box>
  )
}
