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
  Alert,
  Snackbar
} from '@mui/material'
import { spacing } from 'astra'
import type { AgentWithStatus, AgentDefinition } from '../repo/AgentsRepo'

interface AgentsListViewProps {
  agents: AgentWithStatus[]
  selectedAgentId: string | null
  onSelectAgent: (agent: AgentWithStatus) => void
}

export const AgentsListView: FC<AgentsListViewProps> = ({
  agents,
  selectedAgentId,
  onSelectAgent
}) => {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: spacing.sm }}>
      <Typography variant="h6">Agents</Typography>
      <List sx={{ p: 0 }}>
        {agents.map((agentWithStatus) => (
          <ListItemButton
            key={agentWithStatus.agent.uid}
            selected={selectedAgentId === agentWithStatus.agent.uid}
            onClick={() => onSelectAgent(agentWithStatus)}
            sx={{ borderRadius: 1, mb: 0.5 }}
          >
            <ListItemText
              primary={
                <Box
                  sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                >
                  <Typography variant="body1">{agentWithStatus.agent.name}</Typography>
                  {agentWithStatus.syncStatus === 'SYNCED' && (
                    <Chip label="In Vault" size="small" color="success" variant="outlined" />
                  )}
                  {agentWithStatus.syncStatus === 'NEW' && (
                    <Chip label="New" size="small" color="warning" variant="outlined" />
                  )}
                </Box>
              }
              secondary={agentWithStatus.agent.role}
            />
          </ListItemButton>
        ))}
      </List>
    </Box>
  )
}

interface AgentDetailViewProps {
  agentWithStatus: AgentWithStatus | null
  isSaving: boolean
  onSaveToVault: (agent: AgentDefinition) => Promise<void>
}

export const AgentDetailView: FC<AgentDetailViewProps> = ({
  agentWithStatus,
  isSaving,
  onSaveToVault
}) => {
  const [banner, setBanner] = useState<{ severity: 'success' | 'error'; message: string } | null>(
    null
  )

  if (!agentWithStatus) {
    return (
      <Box sx={{ p: spacing.xl }}>
        <Typography color="text.secondary">Select an agent to view details</Typography>
      </Box>
    )
  }

  const { agent, syncStatus } = agentWithStatus

  const handleSaveToVault = async () => {
    await onSaveToVault(agent)
    setBanner({ severity: 'success', message: 'Agent saved to vault' })
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: spacing.md }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h5">{agent.name}</Typography>
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
          Role
        </Typography>
        <Typography>{agent.role}</Typography>
      </Paper>

      <Paper sx={{ p: spacing.md }}>
        <Typography variant="subtitle2" color="text.secondary">
          Backstory
        </Typography>
        <Typography>{agent.backstory}</Typography>
      </Paper>

      <Paper sx={{ p: spacing.md }}>
        <Typography variant="subtitle2" color="text.secondary">
          Goal
        </Typography>
        <Typography>{agent.goal}</Typography>
      </Paper>

      <Paper sx={{ p: spacing.md }}>
        <Typography variant="subtitle2" color="text.secondary">
          Core Objective
        </Typography>
        <Typography>{agent.core_objective}</Typography>
      </Paper>

      <Paper sx={{ p: spacing.md }}>
        <Typography variant="subtitle2" color="text.secondary">
          Individual Vision
        </Typography>
        <Typography>{agent.individual_vision}</Typography>
      </Paper>

      <Paper sx={{ p: spacing.md }}>
        <Typography variant="subtitle2" color="text.secondary">
          Role Non-Negotiable Requirements
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: spacing.xs }}>
          {agent.role_non_negotiable_requirements.map((req, idx) => (
            <Box key={idx} sx={{ display: 'flex', alignItems: 'center', gap: spacing.xs }}>
              <Typography color="primary">•</Typography>
              <Typography>{req}</Typography>
            </Box>
          ))}
        </Box>
      </Paper>

      <Paper sx={{ p: spacing.md }}>
        <Typography variant="subtitle2" color="text.secondary">
          Skills
        </Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: spacing.xs }}>
          {agent.skills.map((skill, idx) => (
            <Chip key={idx} label={skill} size="small" variant="outlined" />
          ))}
        </Box>
      </Paper>

      <Paper sx={{ p: spacing.md }}>
        <Typography variant="subtitle2" color="text.secondary">
          KPIs
        </Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: spacing.xs }}>
          {agent.kpis.map((kpi, idx) => (
            <Chip key={idx} label={kpi} size="small" variant="outlined" />
          ))}
        </Box>
      </Paper>

      {agent.constraints && agent.constraints.length > 0 && (
        <Paper sx={{ p: spacing.md }}>
          <Typography variant="subtitle2" color="text.secondary">
            Constraints
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: spacing.xs }}>
            {agent.constraints.map((constraint, idx) => (
              <Box key={idx} sx={{ display: 'flex', alignItems: 'center', gap: spacing.xs }}>
                <Typography color="primary">•</Typography>
                <Typography>{constraint}</Typography>
              </Box>
            ))}
          </Box>
        </Paper>
      )}

      {agent.interaction_style && (
        <Paper sx={{ p: spacing.md }}>
          <Typography variant="subtitle2" color="text.secondary">
            Interaction Style
          </Typography>
          <Typography>{agent.interaction_style}</Typography>
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
