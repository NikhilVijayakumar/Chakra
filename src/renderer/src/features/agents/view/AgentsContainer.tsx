import { FC } from 'react'
import { Alert, Box, CircularProgress } from '@mui/material'
import { useAgentsViewModel } from '../viewmodel/useAgentsViewModel'
import { AgentsListView, AgentDetailView } from './AgentsView'

export const AgentsContainer: FC = () => {
  const vm = useAgentsViewModel()

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

  const selectedAgentId = vm.selectedAgent?.agent.uid ?? null

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
        <AgentsListView
          agents={vm.agents}
          selectedAgentId={selectedAgentId}
          onSelectAgent={vm.selectAgent}
        />
      </Box>
      <Box sx={{ flex: 1, p: 2, overflow: 'auto' }}>
        <AgentDetailView
          agentWithStatus={vm.selectedAgent}
          isSaving={vm.isSaving}
          onSaveToVault={vm.saveAgentToVault}
        />
      </Box>
    </Box>
  )
}
