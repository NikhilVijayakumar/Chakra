import { FC } from 'react'
import { Box, Typography, useTheme as useMuiTheme } from '@mui/material'
import { useLanguage } from 'astra'
import { spacing } from 'astra'
import { FundingDigestPayload } from '../repo/FundingRepo'
import { EntityConfidenceRow, PageHeader, TrendMetricCard } from 'astra/components'

interface FundingDigestProps {
  payload: FundingDigestPayload | null
  isLoading: boolean
  onRefresh: () => void
}

export const FundingDigestView: FC<FundingDigestProps> = ({ payload, isLoading, onRefresh }) => {
  const muiTheme = useMuiTheme()
  const { literal } = useLanguage()

  return (
    <Box sx={{ p: spacing.xl, maxWidth: '1000px', mx: 'auto', animation: 'fadeIn 0.4s ease-out' }}>
      <PageHeader
        title={literal['fundingDigest.title']}
        subtitle={literal['fundingDigest.subtitle']}
        primaryAction={{
          label: isLoading
            ? literal['fundingDigest.syncing']
            : literal['fundingDigest.syncFinancials'],
          onClick: onRefresh,
          disabled: isLoading,
          variant: 'outlined',
          size: 'small'
        }}
      />

      {payload && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: spacing.xl }}>
          <Box
            sx={{
              display: 'flex',
              gap: spacing.md,
              p: spacing.lg,
              backgroundColor: muiTheme.palette.background.paper,
              border: `1px solid ${muiTheme.palette.divider}`,
              borderRadius: spacing.xs
            }}
          >
            <Box sx={{ flex: 1 }}>
              <Typography variant="micro" sx={{ color: muiTheme.palette.text.secondary }}>
                {literal['fundingDigest.cashInBank']}
              </Typography>
              <Typography
                variant="h4"
                sx={{ color: muiTheme.palette.text.primary, fontVariantNumeric: 'tabular-nums' }}
              >
                {payload.cashInBank}
              </Typography>
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography variant="micro" sx={{ color: muiTheme.palette.text.secondary }}>
                {literal['fundingDigest.monthlyBurn']}
              </Typography>
              <Typography
                variant="h4"
                sx={{ color: muiTheme.palette.error.main, fontVariantNumeric: 'tabular-nums' }}
              >
                {payload.burnRate}
              </Typography>
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography variant="micro" sx={{ color: muiTheme.palette.text.secondary }}>
                {literal['fundingDigest.runway']}
              </Typography>
              <Typography
                variant="h4"
                sx={{
                  color:
                    payload.runwayMonths < 12
                      ? muiTheme.palette.warning.main
                      : muiTheme.palette.success.main,
                  fontVariantNumeric: 'tabular-nums'
                }}
              >
                {payload.runwayMonths} {literal['fundingDigest.months']}
              </Typography>
            </Box>
          </Box>

          <Box>
            <Typography variant="h6" sx={{ color: muiTheme.palette.text.primary, mb: spacing.md }}>
              {literal['fundingDigest.performanceMetrics']}
            </Typography>
            <Box sx={{ display: 'flex', gap: spacing.md }}>
              {payload.metrics.map((metric) => (
                <TrendMetricCard
                  key={metric.label}
                  label={metric.label}
                  value={metric.value}
                  trend={metric.trend}
                  trendValue={metric.trendValue}
                />
              ))}
            </Box>
          </Box>

          <Box>
            <Typography variant="h6" sx={{ color: muiTheme.palette.text.primary, mb: spacing.md }}>
              {literal['fundingDigest.activeInvestorPipeline']}
            </Typography>
            <Box
              sx={{
                backgroundColor: muiTheme.palette.background.paper,
                border: `1px solid ${muiTheme.palette.divider}`,
                borderRadius: spacing.xs,
                overflow: 'hidden'
              }}
            >
              {payload.leads.map((lead, idx) => (
                <EntityConfidenceRow
                  key={lead.id}
                  id={lead.id}
                  title={lead.name}
                  secondaryLabel={lead.firm}
                  statusTag={lead.stage}
                  confidence={lead.confidence}
                  confidenceLabel={literal['fundingDigest.confidence']}
                  showDivider={idx > 0}
                />
              ))}
            </Box>
          </Box>
        </Box>
      )}
    </Box>
  )
}
