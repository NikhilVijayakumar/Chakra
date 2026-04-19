import { FC } from 'react'
import { Alert, Box, Typography, useTheme as useMuiTheme } from '@mui/material'
import { useLanguage } from 'astra'
import { spacing } from 'astra'
import type { OnboardingActionGate } from 'prana/ui/hooks/useOnboardingActionGate'
import { DailyBriefPayload } from '../repo/DailyBriefRepo'
import {
  DecisionActionCard,
  PageHeader,
  StatusListRow,
  SummaryListItem,
  SummaryPanel
} from 'astra/components'

interface DailyBriefProps {
  payload: DailyBriefPayload | null
  isLoading: boolean
  onRefresh: () => void
  actionGate: OnboardingActionGate
}

export const DailyBriefView: FC<DailyBriefProps> = ({
  payload,
  isLoading,
  onRefresh,
  actionGate
}) => {
  const muiTheme = useMuiTheme()
  const { literal } = useLanguage()

  return (
    <Box sx={{ p: spacing.xl, maxWidth: '1000px', mx: 'auto', animation: 'fadeIn 0.4s ease-out' }}>
      <PageHeader
        title={literal['dailyBrief.title']}
        subtitle={literal['dailyBrief.subtitle']}
        primaryAction={{
          label: isLoading ? literal['dailyBrief.compiling'] : literal['dailyBrief.refreshBrief'],
          onClick: onRefresh,
          disabled: isLoading,
          variant: 'outlined',
          size: 'small'
        }}
      />

      {actionGate.isBlocked && (
        <Alert severity="info" sx={{ mb: spacing.md }}>
          {actionGate.message}
        </Alert>
      )}

      {payload && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: spacing.xl }}>
          <SummaryPanel
            title={literal['dailyBrief.schedulerStatus']}
            lines={[
              {
                text: `${literal['dailyBrief.enabledJobs']}: ${payload.scheduleStatus.enabledJobs}/${payload.scheduleStatus.totalJobs}`
              },
              {
                text: `${literal['dailyBrief.nextRun']}: ${payload.scheduleStatus.nextRunAt ? new Date(payload.scheduleStatus.nextRunAt).toLocaleString() : literal['global.na']}`,
                variant: 'caption'
              },
              {
                text: `${literal['dailyBrief.lastRun']}: ${payload.scheduleStatus.lastRunAt ? new Date(payload.scheduleStatus.lastRunAt).toLocaleString() : literal['global.na']}`,
                variant: 'caption'
              }
            ]}
          />

          {/* TOP 3 REQUESTS */}
          <Box>
            <Typography variant="h6" sx={{ color: muiTheme.palette.text.primary, mb: spacing.md }}>
              {literal['dailyBrief.topRequests']}
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: spacing.sm }}>
              {payload.topRequests.map((req) => (
                <SummaryListItem
                  key={req.id}
                  id={req.id}
                  summary={req.summary}
                  source={req.sourceAgent}
                  classification={req.classification}
                />
              ))}
            </Box>
          </Box>

          {/* FUNCTION STATUS */}
          <Box>
            <Typography variant="h6" sx={{ color: muiTheme.palette.text.primary, mb: spacing.md }}>
              {literal['dailyBrief.functionStatus']}
            </Typography>
            <Box
              sx={{
                backgroundColor: muiTheme.palette.background.paper,
                border: `1px solid ${muiTheme.palette.divider}`,
                borderRadius: spacing.xs,
                overflow: 'hidden'
              }}
            >
              {payload.functionStatuses.map((fs, idx) => (
                <StatusListRow
                  key={fs.agentName}
                  domain={fs.domain}
                  statusLine={fs.statusLine}
                  health={fs.health === 'critical' ? 'error' : fs.health}
                  showDivider={idx > 0}
                />
              ))}
            </Box>
          </Box>

          {/* APPROVAL QUEUE */}
          <Box>
            <Typography variant="h6" sx={{ color: muiTheme.palette.text.primary, mb: spacing.md }}>
              {literal['dailyBrief.approvalQueue']}
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: spacing.md }}>
              {payload.approvalQueue.map((aq) => (
                <DecisionActionCard
                  key={aq.id}
                  source={aq.source}
                  description={aq.description}
                  expiryText={`${literal['dailyBrief.expiresIn']} ${aq.expiresInHours}h`}
                  actions={[
                    {
                      label: literal['dailyBrief.approveYes'],
                      variant: 'contained',
                      color: 'success',
                      disabled: actionGate.isBlocked
                    },
                    {
                      label: literal['dailyBrief.rejectNo'],
                      variant: 'outlined',
                      color: 'error',
                      disabled: actionGate.isBlocked
                    },
                    {
                      label: literal['dailyBrief.defer'],
                      variant: 'text',
                      disabled: actionGate.isBlocked
                    }
                  ]}
                />
              ))}
            </Box>
          </Box>
        </Box>
      )}
    </Box>
  )
}
