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
import type { ProtocolWithStatus, ProtocolDoc } from '../repo/ProtocolsRepo'

interface ProtocolsListViewProps {
  protocols: ProtocolWithStatus[]
  selectedProtocolId: string | null
  onSelectProtocol: (protocol: ProtocolWithStatus) => void
}

export const ProtocolsListView: FC<ProtocolsListViewProps> = ({
  protocols,
  selectedProtocolId,
  onSelectProtocol
}) => {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: spacing.sm }}>
      <Typography variant="h6">Protocols</Typography>
      <List sx={{ p: 0 }}>
        {protocols.map((protocolWithStatus) => (
          <ListItemButton
            key={protocolWithStatus.protocol.id}
            selected={selectedProtocolId === protocolWithStatus.protocol.id}
            onClick={() => onSelectProtocol(protocolWithStatus)}
            sx={{ borderRadius: 1, mb: 0.5 }}
          >
            <ListItemText
              primary={
                <Box
                  sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                >
                  <Typography variant="body1">{protocolWithStatus.protocol.title}</Typography>
                  {protocolWithStatus.syncStatus === 'SYNCED' && (
                    <Chip label="In Vault" size="small" color="success" variant="outlined" />
                  )}
                  {protocolWithStatus.syncStatus === 'NEW' && (
                    <Chip label="New" size="small" color="warning" variant="outlined" />
                  )}
                </Box>
              }
              secondary={
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                  {protocolWithStatus.protocol.tags.slice(0, 3).map((tag, idx) => (
                    <Chip
                      key={idx}
                      label={tag}
                      size="small"
                      variant="outlined"
                      sx={{ height: 20 }}
                    />
                  ))}
                </Box>
              }
            />
          </ListItemButton>
        ))}
      </List>
    </Box>
  )
}

interface ProtocolDetailViewProps {
  protocolWithStatus: ProtocolWithStatus | null
  isSaving: boolean
  onSaveToVault: (protocol: ProtocolDoc) => Promise<void>
}

export const ProtocolDetailView: FC<ProtocolDetailViewProps> = ({
  protocolWithStatus,
  isSaving,
  onSaveToVault
}) => {
  const [banner, setBanner] = useState<{ severity: 'success' | 'error'; message: string } | null>(
    null
  )

  if (!protocolWithStatus) {
    return (
      <Box sx={{ p: spacing.xl }}>
        <Typography color="text.secondary">Select a protocol to view details</Typography>
      </Box>
    )
  }

  const { protocol, syncStatus } = protocolWithStatus

  const handleSaveToVault = async () => {
    await onSaveToVault(protocol)
    setBanner({ severity: 'success', message: 'Protocol saved to vault' })
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: spacing.md }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h5">{protocol.title}</Typography>
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
          Tags
        </Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: spacing.xs }}>
          {protocol.tags.map((tag, idx) => (
            <Chip key={idx} label={tag} size="small" variant="outlined" />
          ))}
        </Box>
      </Paper>

      <Paper sx={{ p: spacing.md }}>
        <Typography variant="subtitle2" color="text.secondary">
          Format
        </Typography>
        <Typography>{protocol.format.toUpperCase()}</Typography>
      </Paper>

      {protocol.rules && protocol.rules.length > 0 && (
        <Paper sx={{ p: spacing.md }}>
          <Typography variant="subtitle2" color="text.secondary">
            Rules
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: spacing.xs }}>
            {protocol.rules.map((rule, idx) => (
              <Box key={idx} sx={{ display: 'flex', alignItems: 'center', gap: spacing.xs }}>
                <Typography color="primary">•</Typography>
                <Typography>{rule}</Typography>
              </Box>
            ))}
          </Box>
        </Paper>
      )}

      <Paper sx={{ p: spacing.md }}>
        <Typography variant="subtitle2" color="text.secondary">
          Content
        </Typography>
        <Typography sx={{ whiteSpace: 'pre-wrap' }}>{protocol.content}</Typography>
      </Paper>

      <Paper sx={{ p: spacing.md }}>
        <Typography variant="subtitle2" color="text.secondary">
          Source
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {protocol.sourceFile}
        </Typography>
      </Paper>

      <Snackbar open={Boolean(banner)} autoHideDuration={2600} onClose={() => setBanner(null)}>
        <Alert severity={banner?.severity ?? 'success'} onClose={() => setBanner(null)}>
          {banner?.message ?? ''}
        </Alert>
      </Snackbar>
    </Box>
  )
}
