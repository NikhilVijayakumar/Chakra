import { useState, type FC } from 'react'
import {
  Box,
  Button,
  MenuItem,
  Paper,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography
} from '@mui/material'
import { spacing, useLanguage } from 'astra'
import type { DailyBriefPayload } from '../../daily-brief/repo/DailyBriefRepo'

interface ReportDailyBriefViewProps {
  payload: DailyBriefPayload | null
  isLoading: boolean
  selectedExportFormat: 'pdf' | 'csv'
  isExporting: boolean
  onFormatChange: (format: 'pdf' | 'csv') => void
  onExport: () => void
  onSchedule: (cronExpression: string) => void
  onRefresh: () => void
}

export const ReportDailyBriefView: FC<ReportDailyBriefViewProps> = ({
  payload,
  isLoading,
  selectedExportFormat,
  isExporting,
  onFormatChange,
  onExport,
  onSchedule,
  onRefresh
}) => {
  const { literal } = useLanguage()
  const [cronExpression, setCronExpression] = useState('0 9 * * *')

  return (
    <Box sx={{ p: spacing.xl, maxWidth: 1200, mx: 'auto' }}>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        sx={{ mb: spacing.lg }}
      >
        <Box>
          <Typography variant="h5">
            {literal['reportDailyBrief.title'] || 'Daily Brief Report'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {payload?.date
              ? `${literal['reportDailyBrief.generatedOn'] || 'Generated on'} ${new Date(payload.date).toLocaleString()}`
              : literal['reportDailyBrief.noData'] || 'No report data yet'}
          </Typography>
        </Box>
        <Button variant="outlined" onClick={onRefresh} disabled={isLoading}>
          {isLoading
            ? literal['global.loading'] || 'Loading'
            : literal['global.refresh'] || 'Refresh'}
        </Button>
      </Stack>

      <Paper sx={{ p: spacing.md, mb: spacing.lg }}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={spacing.md} alignItems="center">
          <Select
            size="small"
            value={selectedExportFormat}
            onChange={(event) => onFormatChange(event.target.value as 'pdf' | 'csv')}
          >
            <MenuItem value="pdf">PDF</MenuItem>
            <MenuItem value="csv">CSV</MenuItem>
          </Select>
          <Button variant="contained" onClick={onExport} disabled={isExporting || isLoading}>
            {isExporting
              ? literal['reportDailyBrief.exporting'] || 'Exporting'
              : literal['reportDailyBrief.export'] || 'Export'}
          </Button>
          <TextField
            size="small"
            label={literal['reportDailyBrief.cronExpression'] || 'Cron expression'}
            value={cronExpression}
            onChange={(event) => setCronExpression(event.target.value)}
            sx={{ minWidth: 240 }}
          />
          <Button
            variant="outlined"
            onClick={() => onSchedule(cronExpression)}
            disabled={isLoading}
          >
            {literal['reportDailyBrief.saveSchedule'] || 'Save schedule'}
          </Button>
        </Stack>
      </Paper>

      {payload && (
        <Stack spacing={spacing.lg}>
          <Paper sx={{ p: spacing.md }}>
            <Typography variant="h6" sx={{ mb: spacing.sm }}>
              {literal['dailyBrief.topRequests'] || 'Top Requests'}
            </Typography>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>{literal['global.id'] || 'ID'}</TableCell>
                  <TableCell>{literal['global.source'] || 'Source'}</TableCell>
                  <TableCell>{literal['global.summary'] || 'Summary'}</TableCell>
                  <TableCell>{literal['global.priority'] || 'Priority'}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {payload.topRequests.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell>{request.id}</TableCell>
                    <TableCell>{request.sourceAgent}</TableCell>
                    <TableCell>{request.summary}</TableCell>
                    <TableCell>{request.classification}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Paper>

          <Paper sx={{ p: spacing.md }}>
            <Typography variant="h6" sx={{ mb: spacing.sm }}>
              {literal['dailyBrief.functionStatus'] || 'Function Status'}
            </Typography>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>{literal['global.agent'] || 'Agent'}</TableCell>
                  <TableCell>{literal['global.domain'] || 'Domain'}</TableCell>
                  <TableCell>{literal['global.health'] || 'Health'}</TableCell>
                  <TableCell>{literal['global.status'] || 'Status'}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {payload.functionStatuses.map((status) => (
                  <TableRow key={`${status.agentName}-${status.domain}`}>
                    <TableCell>{status.agentName}</TableCell>
                    <TableCell>{status.domain}</TableCell>
                    <TableCell>{status.health}</TableCell>
                    <TableCell>{status.statusLine}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Paper>

          <Paper sx={{ p: spacing.md }}>
            <Typography variant="h6" sx={{ mb: spacing.sm }}>
              {literal['dailyBrief.approvalQueue'] || 'Approval Queue'}
            </Typography>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>{literal['global.id'] || 'ID'}</TableCell>
                  <TableCell>{literal['global.source'] || 'Source'}</TableCell>
                  <TableCell>{literal['global.description'] || 'Description'}</TableCell>
                  <TableCell>{literal['global.expiry'] || 'Expiry'}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {payload.approvalQueue.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{item.id}</TableCell>
                    <TableCell>{item.source}</TableCell>
                    <TableCell>{item.description}</TableCell>
                    <TableCell>{item.expiresInHours}h</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Paper>
        </Stack>
      )}
    </Box>
  )
}
