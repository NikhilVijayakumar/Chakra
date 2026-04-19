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
import type { WorkflowWithStatus, WorkflowDefinition } from '../repo/WorkflowsRepo'

interface WorkflowsListViewProps {
  workflows: WorkflowWithStatus[]
  selectedWorkflowId: string | null
  onSelectWorkflow: (workflow: WorkflowWithStatus) => void
}

export const WorkflowsListView: FC<WorkflowsListViewProps> = ({
  workflows,
  selectedWorkflowId,
  onSelectWorkflow
}) => {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: spacing.sm }}>
      <Typography variant="h6">Workflows</Typography>
      <List sx={{ p: 0 }}>
        {workflows.map((workflowWithStatus) => (
          <ListItemButton
            key={workflowWithStatus.workflow.id}
            selected={selectedWorkflowId === workflowWithStatus.workflow.id}
            onClick={() => onSelectWorkflow(workflowWithStatus)}
            sx={{ borderRadius: 1, mb: 0.5 }}
          >
            <ListItemText
              primary={
                <Box
                  sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                >
                  <Typography variant="body1">{workflowWithStatus.workflow.id}</Typography>
                  {workflowWithStatus.syncStatus === 'SYNCED' && (
                    <Chip label="In Vault" size="small" color="success" variant="outlined" />
                  )}
                  {workflowWithStatus.syncStatus === 'NEW' && (
                    <Chip label="New" size="small" color="warning" variant="outlined" />
                  )}
                </Box>
              }
              secondary={`Trigger: ${workflowWithStatus.workflow.trigger}`}
            />
          </ListItemButton>
        ))}
      </List>
    </Box>
  )
}

interface WorkflowDetailViewProps {
  workflowWithStatus: WorkflowWithStatus | null
  isSaving: boolean
  onSaveToVault: (workflow: WorkflowDefinition) => Promise<void>
}

export const WorkflowDetailView: FC<WorkflowDetailViewProps> = ({
  workflowWithStatus,
  isSaving,
  onSaveToVault
}) => {
  const [banner, setBanner] = useState<{ severity: 'success' | 'error'; message: string } | null>(
    null
  )

  if (!workflowWithStatus) {
    return (
      <Box sx={{ p: spacing.xl }}>
        <Typography color="text.secondary">Select a workflow to view details</Typography>
      </Box>
    )
  }

  const { workflow, syncStatus } = workflowWithStatus

  const handleSaveToVault = async () => {
    await onSaveToVault(workflow)
    setBanner({ severity: 'success', message: 'Workflow saved to vault' })
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: spacing.md }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h5">{workflow.id}</Typography>
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
          Agent ID
        </Typography>
        <Typography>{workflow.agent_id}</Typography>
      </Paper>

      <Paper sx={{ p: spacing.md }}>
        <Typography variant="subtitle2" color="text.secondary">
          Trigger
        </Typography>
        <Typography>{workflow.trigger}</Typography>
      </Paper>

      {workflow.workflow_mode && (
        <Paper sx={{ p: spacing.md }}>
          <Typography variant="subtitle2" color="text.secondary">
            Workflow Mode
          </Typography>
          <Typography>{workflow.workflow_mode}</Typography>
        </Paper>
      )}

      <Paper sx={{ p: spacing.md }}>
        <Typography variant="subtitle2" color="text.secondary">
          Expected Output
        </Typography>
        <Typography>{workflow.expected_output}</Typography>
      </Paper>

      <Paper sx={{ p: spacing.md }}>
        <Typography variant="subtitle2" color="text.secondary">
          Dependencies
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: spacing.xs }}>
          <Typography>
            <strong>Required Skills:</strong>{' '}
            {workflow.dependencies.required_skills.join(', ') || 'None'}
          </Typography>
          <Typography>
            <strong>Required KPIs:</strong>{' '}
            {workflow.dependencies.required_kpis.join(', ') || 'None'}
          </Typography>
          {workflow.dependencies.data_inputs && (
            <Typography>
              <strong>Data Inputs:</strong> {workflow.dependencies.data_inputs.join(', ')}
            </Typography>
          )}
          {workflow.dependencies.protocols && (
            <Typography>
              <strong>Protocols:</strong> {workflow.dependencies.protocols.join(', ')}
            </Typography>
          )}
        </Box>
      </Paper>

      {workflow.metadata?.status && (
        <Paper sx={{ p: spacing.md }}>
          <Typography variant="subtitle2" color="text.secondary">
            Status
          </Typography>
          <Chip label={workflow.metadata.status} size="small" variant="outlined" />
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
