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
import type { FundingDigestPayload } from '../../funding-digest/repo/FundingRepo'

interface ReportFundingDigestViewProps {
  payload: FundingDigestPayload | null
  isLoading: boolean
  selectedExportFormat: 'pdf' | 'csv'
  isExporting: boolean
  onFormatChange: (format: 'pdf' | 'csv') => void
  onExport: () => void
  onSchedule: (cronExpression: string) => void
  onRefresh: () => void
}

export const ReportFundingDigestView: FC<ReportFundingDigestViewProps> = ({
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
  const [cronExpression, setCronExpression] = useState('0 10 * * 1')

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
            {literal['reportFundingDigest.title'] || 'Funding Digest Report'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {literal['reportFundingDigest.subtitle'] ||
              'Runway, burn, metrics, and investor pipeline'}
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
              ? literal['reportFundingDigest.exporting'] || 'Exporting'
              : literal['reportFundingDigest.export'] || 'Export'}
          </Button>
          <TextField
            size="small"
            label={literal['reportFundingDigest.cronExpression'] || 'Cron expression'}
            value={cronExpression}
            onChange={(event) => setCronExpression(event.target.value)}
            sx={{ minWidth: 240 }}
          />
          <Button
            variant="outlined"
            onClick={() => onSchedule(cronExpression)}
            disabled={isLoading}
          >
            {literal['reportFundingDigest.saveSchedule'] || 'Save schedule'}
          </Button>
        </Stack>
      </Paper>

      {payload && (
        <Stack spacing={spacing.lg}>
          <Paper sx={{ p: spacing.md }}>
            <Typography variant="h6" sx={{ mb: spacing.sm }}>
              {literal['fundingDigest.performanceMetrics'] || 'Financial Summary'}
            </Typography>
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={spacing.lg}>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  {literal['fundingDigest.cashInBank'] || 'Cash in Bank'}
                </Typography>
                <Typography variant="h6">{payload.cashInBank}</Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  {literal['fundingDigest.monthlyBurn'] || 'Monthly Burn'}
                </Typography>
                <Typography variant="h6">{payload.burnRate}</Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  {literal['fundingDigest.runway'] || 'Runway'}
                </Typography>
                <Typography variant="h6">
                  {payload.runwayMonths} {literal['fundingDigest.months'] || 'months'}
                </Typography>
              </Box>
            </Stack>
          </Paper>

          <Paper sx={{ p: spacing.md }}>
            <Typography variant="h6" sx={{ mb: spacing.sm }}>
              {literal['fundingDigest.performanceMetrics'] || 'Performance Metrics'}
            </Typography>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>{literal['global.metric'] || 'Metric'}</TableCell>
                  <TableCell>{literal['global.value'] || 'Value'}</TableCell>
                  <TableCell>{literal['global.trend'] || 'Trend'}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {payload.metrics.map((metric) => (
                  <TableRow key={metric.label}>
                    <TableCell>{metric.label}</TableCell>
                    <TableCell>{metric.value}</TableCell>
                    <TableCell>
                      {metric.trend} ({metric.trendValue})
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Paper>

          <Paper sx={{ p: spacing.md }}>
            <Typography variant="h6" sx={{ mb: spacing.sm }}>
              {literal['fundingDigest.activeInvestorPipeline'] || 'Funding Leads'}
            </Typography>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>{literal['global.id'] || 'ID'}</TableCell>
                  <TableCell>{literal['global.name'] || 'Name'}</TableCell>
                  <TableCell>{literal['global.firm'] || 'Firm'}</TableCell>
                  <TableCell>{literal['global.stage'] || 'Stage'}</TableCell>
                  <TableCell>{literal['fundingDigest.confidence'] || 'Confidence'}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {payload.leads.map((lead) => (
                  <TableRow key={lead.id}>
                    <TableCell>{lead.id}</TableCell>
                    <TableCell>{lead.name}</TableCell>
                    <TableCell>{lead.firm}</TableCell>
                    <TableCell>{lead.stage}</TableCell>
                    <TableCell>{lead.confidence}%</TableCell>
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
