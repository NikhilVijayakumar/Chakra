import { FC } from 'react'
import { Alert, Box, CircularProgress } from '@mui/material'
import { useWorkflowsViewModel } from '../viewmodel/useWorkflowsViewModel'
import { WorkflowsListView, WorkflowDetailView } from './WorkflowsView'

export const WorkflowsContainer: FC = () => {
  const vm = useWorkflowsViewModel()

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

  const selectedWorkflowId = vm.selectedWorkflow?.workflow.id ?? null

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
        <WorkflowsListView
          workflows={vm.workflows}
          selectedWorkflowId={selectedWorkflowId}
          onSelectWorkflow={vm.selectWorkflow}
        />
      </Box>
      <Box sx={{ flex: 1, p: 2, overflow: 'auto' }}>
        <WorkflowDetailView
          workflowWithStatus={vm.selectedWorkflow}
          isSaving={vm.isSaving}
          onSaveToVault={vm.saveWorkflowToVault}
        />
      </Box>
    </Box>
  )
}
