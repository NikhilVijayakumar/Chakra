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
import type { WeeklyReviewPayload } from '../../weekly-review/repo/WeeklyReviewRepo'

interface ReportWeeklyReviewViewProps {
  payload: WeeklyReviewPayload | null
  isLoading: boolean
  selectedExportFormat: 'pdf' | 'csv'
  isExporting: boolean
  onFormatChange: (format: 'pdf' | 'csv') => void
  onExport: () => void
  onSchedule: (cronExpression: string) => void
  onRefresh: () => void
}

export const ReportWeeklyReviewView: FC<ReportWeeklyReviewViewProps> = ({
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
  const [cronExpression, setCronExpression] = useState('0 17 * * 5')

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
            {literal['reportWeeklyReview.title'] || 'Weekly Review Report'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {payload?.weekEnding
              ? `${literal['weeklyReview.weekEnding'] || 'Week ending'}: ${payload.weekEnding}`
              : literal['reportWeeklyReview.noData'] || 'No report data yet'}
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
              ? literal['reportWeeklyReview.exporting'] || 'Exporting'
              : literal['reportWeeklyReview.export'] || 'Export'}
          </Button>
          <TextField
            size="small"
            label={literal['reportWeeklyReview.cronExpression'] || 'Cron expression'}
            value={cronExpression}
            onChange={(event) => setCronExpression(event.target.value)}
            sx={{ minWidth: 240 }}
          />
          <Button
            variant="outlined"
            onClick={() => onSchedule(cronExpression)}
            disabled={isLoading}
          >
            {literal['reportWeeklyReview.saveSchedule'] || 'Save schedule'}
          </Button>
        </Stack>
      </Paper>

      {payload && (
        <Stack spacing={spacing.lg}>
          <Paper sx={{ p: spacing.md }}>
            <Typography variant="h6" sx={{ mb: spacing.sm }}>
              {literal['weeklyReview.schedulerSummary'] || 'Scheduler Summary'}
            </Typography>
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={spacing.lg}>
              <Typography variant="body2">
                {literal['weeklyReview.enabledJobs'] || 'Enabled Jobs'}:{' '}
                {payload.scheduleStatus.enabledJobs}/{payload.scheduleStatus.totalJobs}
              </Typography>
              <Typography variant="body2">
                {literal['weeklyReview.successfulJobs'] || 'Successful'}:{' '}
                {payload.scheduleStatus.successfulJobs}
              </Typography>
              <Typography variant="body2">
                {literal['weeklyReview.failedJobs'] || 'Failed'}:{' '}
                {payload.scheduleStatus.failedJobs}
              </Typography>
            </Stack>
          </Paper>

          <Paper sx={{ p: spacing.md }}>
            <Typography variant="h6" sx={{ mb: spacing.sm }}>
              {literal['weeklyReview.description'] || 'Agent Performance Review'}
            </Typography>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>{literal['global.agent'] || 'Agent'}</TableCell>
                  <TableCell>{literal['global.domain'] || 'Domain'}</TableCell>
                  <TableCell>{literal['weeklyReview.whatImproved'] || 'Improvements'}</TableCell>
                  <TableCell>{literal['weeklyReview.whatSlipped'] || 'Slips'}</TableCell>
                  <TableCell>{literal['weeklyReview.whatRiskIncreased'] || 'Risks'}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {payload.reports.map((report) => (
                  <TableRow key={`${report.agent}-${report.domain}`}>
                    <TableCell>{report.agent}</TableCell>
                    <TableCell>{report.domain}</TableCell>
                    <TableCell>{report.improvements.join(', ') || '-'}</TableCell>
                    <TableCell>{report.slips.join(', ') || '-'}</TableCell>
                    <TableCell>{report.risks.join(', ') || '-'}</TableCell>
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
