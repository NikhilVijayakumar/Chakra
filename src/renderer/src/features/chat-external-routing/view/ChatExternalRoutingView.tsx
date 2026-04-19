import type { FC } from 'react'
import {
  Box,
  Button,
  MenuItem,
  Paper,
  Select,
  Stack,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography
} from '@mui/material'
import { spacing, useLanguage } from 'astra'
import type { Channel, RoutingRule } from '../repo/ChatExternalRoutingRepo'

interface ChatExternalRoutingViewProps {
  channels: Channel[]
  rules: RoutingRule[]
  isLoadingChannels: boolean
  isLoadingRules: boolean
  formOpen: boolean
  isCreating: boolean
  selectedChannelId: string | null
  newRule: Partial<RoutingRule>
  onChannelSelect: (channelId: string | null) => void
  onFormOpen: () => void
  onFormClose: () => void
  onCreateRule: () => void
  onUpdateRule: (id: string, updates: Partial<RoutingRule>) => void
  onDeleteRule: (id: string) => void
  onFormFieldChange: <K extends keyof RoutingRule>(field: K, value: RoutingRule[K]) => void
  onRefresh: () => void
}

export const ChatExternalRoutingView: FC<ChatExternalRoutingViewProps> = ({
  channels,
  rules,
  isLoadingChannels,
  isLoadingRules,
  formOpen,
  isCreating,
  selectedChannelId,
  newRule,
  onChannelSelect,
  onFormOpen,
  onFormClose,
  onCreateRule,
  onUpdateRule,
  onDeleteRule,
  onFormFieldChange,
  onRefresh
}) => {
  const { literal } = useLanguage()

  return (
    <Box sx={{ p: spacing.xl, maxWidth: 1300, mx: 'auto' }}>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        sx={{ mb: spacing.md }}
      >
        <Typography variant="h5">
          {literal['chatExternalRouting.title'] || 'External Chat Routing'}
        </Typography>
        <Stack direction="row" spacing={1}>
          <Button variant="outlined" onClick={onRefresh}>
            {literal['global.refresh'] || 'Refresh'}
          </Button>
          <Button variant="contained" onClick={onFormOpen}>
            {literal['chatExternalRouting.addRule'] || 'Add Rule'}
          </Button>
        </Stack>
      </Stack>

      <Paper sx={{ p: spacing.md, mb: spacing.md }}>
        <Typography variant="subtitle1" sx={{ mb: spacing.sm }}>
          {literal['chatExternalRouting.channels'] || 'Available Channels'}
        </Typography>
        {isLoadingChannels ? (
          <Typography variant="body2" color="text.secondary">
            {literal['global.loading'] || 'Loading'}
          </Typography>
        ) : (
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={spacing.sm}>
            {channels.map((channel) => (
              <Paper
                key={channel.id}
                sx={{
                  p: spacing.sm,
                  minWidth: 220,
                  borderWidth: selectedChannelId === channel.id ? 2 : 1,
                  borderStyle: 'solid',
                  borderColor: selectedChannelId === channel.id ? 'primary.main' : 'divider',
                  cursor: 'pointer'
                }}
                onClick={() => onChannelSelect(channel.id)}
              >
                <Typography variant="subtitle2">{channel.name}</Typography>
                <Typography variant="caption" color="text.secondary">
                  {channel.enabled
                    ? literal['global.enabled'] || 'Enabled'
                    : literal['global.disabled'] || 'Disabled'}
                </Typography>
              </Paper>
            ))}
          </Stack>
        )}
      </Paper>

      {formOpen && (
        <Paper sx={{ p: spacing.md, mb: spacing.md }}>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={spacing.sm} alignItems="center">
            <Select
              size="small"
              value={newRule.source ?? 'broadcast'}
              onChange={(event) => onFormFieldChange('source', String(event.target.value))}
              sx={{ minWidth: 180 }}
            >
              <MenuItem value="broadcast">broadcast</MenuItem>
              <MenuItem value="director">director</MenuItem>
              <MenuItem value="agent">agent</MenuItem>
            </Select>

            <Select
              size="small"
              value={newRule.targetChannel ?? ''}
              displayEmpty
              onChange={(event) => onFormFieldChange('targetChannel', String(event.target.value))}
              sx={{ minWidth: 220 }}
            >
              <MenuItem value="">
                {literal['chatExternalRouting.selectChannel'] || 'Select channel'}
              </MenuItem>
              {channels.map((channel) => (
                <MenuItem key={channel.id} value={channel.id}>
                  {channel.name}
                </MenuItem>
              ))}
            </Select>

            <Select
              size="small"
              value={newRule.classification ?? 'INTERNAL'}
              onChange={(event) =>
                onFormFieldChange(
                  'classification',
                  event.target.value as 'PUBLIC' | 'INTERNAL' | 'CONFIDENTIAL' | 'RESTRICTED'
                )
              }
              sx={{ minWidth: 220 }}
            >
              {(['PUBLIC', 'INTERNAL', 'CONFIDENTIAL', 'RESTRICTED'] as const).map(
                (classification) => (
                  <MenuItem key={classification} value={classification}>
                    {classification}
                  </MenuItem>
                )
              )}
            </Select>

            <Button variant="contained" onClick={onCreateRule} disabled={isCreating}>
              {isCreating
                ? literal['global.creating'] || 'Creating'
                : literal['global.save'] || 'Save'}
            </Button>
            <Button variant="text" onClick={onFormClose}>
              {literal['global.cancel'] || 'Cancel'}
            </Button>
          </Stack>
        </Paper>
      )}

      <Paper sx={{ p: spacing.md }}>
        <Typography variant="subtitle1" sx={{ mb: spacing.sm }}>
          {literal['chatExternalRouting.rules'] || 'Routing Rules'}
        </Typography>

        {isLoadingRules ? (
          <Typography variant="body2" color="text.secondary">
            {literal['global.loading'] || 'Loading'}
          </Typography>
        ) : (
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>{literal['chatExternalRouting.source'] || 'Source'}</TableCell>
                <TableCell>
                  {literal['chatExternalRouting.targetChannel'] || 'Target Channel'}
                </TableCell>
                <TableCell>
                  {literal['chatExternalRouting.classification'] || 'Classification'}
                </TableCell>
                <TableCell>{literal['global.enabled'] || 'Enabled'}</TableCell>
                <TableCell>{literal['global.actions'] || 'Actions'}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rules.map((rule) => (
                <TableRow key={rule.id}>
                  <TableCell>{rule.source ?? 'broadcast'}</TableCell>
                  <TableCell>{rule.targetChannel}</TableCell>
                  <TableCell>{rule.classification}</TableCell>
                  <TableCell>
                    <Switch
                      checked={rule.enabled}
                      onChange={(event) => onUpdateRule(rule.id, { enabled: event.target.checked })}
                    />
                  </TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={1}>
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => onUpdateRule(rule.id, rule)}
                      >
                        {literal['global.edit'] || 'Edit'}
                      </Button>
                      <Button size="small" color="error" onClick={() => onDeleteRule(rule.id)}>
                        {literal['global.delete'] || 'Delete'}
                      </Button>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Paper>
    </Box>
  )
}
