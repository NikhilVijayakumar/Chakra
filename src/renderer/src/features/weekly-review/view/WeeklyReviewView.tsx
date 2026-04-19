import { FC } from 'react'
import { Box, Typography, useTheme as useMuiTheme } from '@mui/material'
import { useLanguage } from 'astra'
import { spacing } from 'astra'
import { WeeklyReviewPayload } from '../repo/WeeklyReviewRepo'
import { PageHeader, SummaryPanel, WeeklyReportCard } from 'astra/components'

interface WeeklyReviewProps {
  payload: WeeklyReviewPayload | null
  isLoading: boolean
  onRefresh: () => void
}

export const WeeklyReviewView: FC<WeeklyReviewProps> = ({ payload, isLoading, onRefresh }) => {
  const muiTheme = useMuiTheme()
  const { literal } = useLanguage()

  return (
    <Box sx={{ p: spacing.xl, maxWidth: '1200px', mx: 'auto', animation: 'fadeIn 0.4s ease-out' }}>
      <PageHeader
        title={literal['nav.weeklyReview']}
        subtitle={literal['weeklyReview.description']}
        trailingMeta={
          payload ? (
            <Typography variant="body2Bold" sx={{ color: muiTheme.palette.text.secondary }}>
              {literal['weeklyReview.weekEnding']}: {payload.weekEnding}
            </Typography>
          ) : undefined
        }
        primaryAction={{
          label: isLoading
            ? literal['weeklyReview.compiling']
            : literal['weeklyReview.compileReport'],
          onClick: onRefresh,
          disabled: isLoading,
          variant: 'outlined',
          size: 'small'
        }}
      />

      {payload && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: spacing.lg }}>
          <SummaryPanel
            title={literal['weeklyReview.schedulerSummary']}
            lines={[
              {
                text: `${literal['weeklyReview.enabledJobs']}: ${payload.scheduleStatus.enabledJobs}/${payload.scheduleStatus.totalJobs} | ${literal['weeklyReview.successfulJobs']}: ${payload.scheduleStatus.successfulJobs} | ${literal['weeklyReview.failedJobs']}: ${payload.scheduleStatus.failedJobs}`
              },
              {
                text: `${literal['weeklyReview.lastTick']}: ${payload.scheduleStatus.lastTickAt ? new Date(payload.scheduleStatus.lastTickAt).toLocaleString() : literal['global.na']}`,
                variant: 'caption'
              }
            ]}
          />

          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
              gap: spacing.lg
            }}
          >
            {payload.reports.map((report) => (
              <WeeklyReportCard
                key={report.agent}
                owner={report.agent}
                domain={report.domain}
                customMetricLabel={report.customMetricLabel}
                customMetricValue={report.customMetricValue}
                improvements={report.improvements}
                slips={report.slips}
                risks={report.risks}
                labels={{
                  improvedTitle: literal['weeklyReview.whatImproved'],
                  slipsTitle: literal['weeklyReview.whatSlipped'],
                  risksTitle: literal['weeklyReview.whatRiskIncreased'],
                  emptyImproved: literal['weeklyReview.noMajorImprovements'],
                  emptySlips: literal['weeklyReview.noSlips'],
                  emptyRisks: literal['weeklyReview.noIncreasedRisks']
                }}
              />
            ))}
          </Box>
        </Box>
      )}
    </Box>
  )
}
