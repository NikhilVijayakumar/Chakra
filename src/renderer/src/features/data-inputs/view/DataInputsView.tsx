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
import type { DataInputWithStatus, DataInputDefinition } from '../repo/DataInputsRepo'

interface DataInputsListViewProps {
  dataInputs: DataInputWithStatus[]
  selectedDataInputId: string | null
  onSelectDataInput: (dataInput: DataInputWithStatus) => void
}

export const DataInputsListView: FC<DataInputsListViewProps> = ({
  dataInputs,
  selectedDataInputId,
  onSelectDataInput
}) => {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: spacing.sm }}>
      <Typography variant="h6">Data Inputs</Typography>
      <List sx={{ p: 0 }}>
        {dataInputs.map((dataInputWithStatus) => (
          <ListItemButton
            key={dataInputWithStatus.dataInput.uid}
            selected={selectedDataInputId === dataInputWithStatus.dataInput.uid}
            onClick={() => onSelectDataInput(dataInputWithStatus)}
            sx={{ borderRadius: 1, mb: 0.5 }}
          >
            <ListItemText
              primary={
                <Box
                  sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                >
                  <Typography variant="body1">{dataInputWithStatus.dataInput.name}</Typography>
                  {dataInputWithStatus.syncStatus === 'SYNCED' && (
                    <Chip label="In Vault" size="small" color="success" variant="outlined" />
                  )}
                  {dataInputWithStatus.syncStatus === 'NEW' && (
                    <Chip label="New" size="small" color="warning" variant="outlined" />
                  )}
                </Box>
              }
              secondary={`Type: ${dataInputWithStatus.dataInput.schemaType}`}
            />
          </ListItemButton>
        ))}
      </List>
    </Box>
  )
}

interface DataInputDetailViewProps {
  dataInputWithStatus: DataInputWithStatus | null
  isSaving: boolean
  onSaveToVault: (dataInput: DataInputDefinition) => Promise<void>
}

export const DataInputDetailView: FC<DataInputDetailViewProps> = ({
  dataInputWithStatus,
  isSaving,
  onSaveToVault
}) => {
  const [banner, setBanner] = useState<{ severity: 'success' | 'error'; message: string } | null>(
    null
  )

  if (!dataInputWithStatus) {
    return (
      <Box sx={{ p: spacing.xl }}>
        <Typography color="text.secondary">Select a data input to view details</Typography>
      </Box>
    )
  }

  const { dataInput, syncStatus } = dataInputWithStatus

  const handleSaveToVault = async () => {
    await onSaveToVault(dataInput)
    setBanner({ severity: 'success', message: 'Data Input saved to vault' })
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: spacing.md }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h5">{dataInput.name}</Typography>
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
          Description
        </Typography>
        <Typography>{dataInput.description}</Typography>
      </Paper>

      <Paper sx={{ p: spacing.md }}>
        <Typography variant="subtitle2" color="text.secondary">
          Schema Type
        </Typography>
        <Chip label={dataInput.schemaType} size="small" variant="outlined" />
      </Paper>

      {dataInput.sourceType && (
        <Paper sx={{ p: spacing.md }}>
          <Typography variant="subtitle2" color="text.secondary">
            Source Type
          </Typography>
          <Chip label={dataInput.sourceType} size="small" variant="outlined" />
        </Paper>
      )}

      {dataInput.sourceLocation && (
        <Paper sx={{ p: spacing.md }}>
          <Typography variant="subtitle2" color="text.secondary">
            Source Location
          </Typography>
          <Typography>{dataInput.sourceLocation}</Typography>
        </Paper>
      )}

      <Paper sx={{ p: spacing.md }}>
        <Typography variant="subtitle2" color="text.secondary">
          Required Fields
        </Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: spacing.xs }}>
          {dataInput.requiredFields.map((field, idx) => {
            const label = typeof field === 'string' ? field : field.name
            const required = typeof field === 'object' && field.required
            return (
              <Chip
                key={idx}
                label={label + (required ? ' *' : '')}
                size="small"
                variant="outlined"
              />
            )
          })}
        </Box>
      </Paper>

      {dataInput.updateFrequency && (
        <Paper sx={{ p: spacing.md }}>
          <Typography variant="subtitle2" color="text.secondary">
            Update Frequency
          </Typography>
          <Typography>{dataInput.updateFrequency}</Typography>
        </Paper>
      )}

      {dataInput.privacyClassification && (
        <Paper sx={{ p: spacing.md }}>
          <Typography variant="subtitle2" color="text.secondary">
            Privacy Classification
          </Typography>
          <Chip label={dataInput.privacyClassification} size="small" variant="outlined" />
        </Paper>
      )}

      {dataInput.responsibleAgent && (
        <Paper sx={{ p: spacing.md }}>
          <Typography variant="subtitle2" color="text.secondary">
            Responsible Agent
          </Typography>
          <Typography>{dataInput.responsibleAgent}</Typography>
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
