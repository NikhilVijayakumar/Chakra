import { FC } from 'react'
import {
  Alert,
  Box,
  Button,
  Chip,
  Divider,
  Stack,
  Typography,
  useTheme as useMuiTheme
} from '@mui/material'
import { useLanguage } from 'astra'
import { spacing } from 'astra'
import {
  AdministrationIntegrationSnapshotPayload,
  SocialTrendIntelligenceOutputPayload
} from '../repo/ExecutiveSuitesRepo'
import type { OnboardingActionGate } from 'prana/ui/hooks/useOnboardingActionGate'

interface ExecutiveSuitesViewProps {
  snapshot: AdministrationIntegrationSnapshotPayload | null
  trendOutput: SocialTrendIntelligenceOutputPayload | null
  onRunTrendIntelligence: () => void
  onRefresh: () => void
  isRunningTrendIntelligence: boolean
  errorMessage: string | null
  actionGate: OnboardingActionGate
}

const getRiskColor = (
  risk: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
): 'default' | 'info' | 'warning' | 'error' => {
  if (risk === 'CRITICAL') {
    return 'error'
  }

  if (risk === 'HIGH') {
    return 'warning'
  }

  if (risk === 'MEDIUM') {
    return 'info'
  }

  return 'default'
}

export const ExecutiveSuitesView: FC<ExecutiveSuitesViewProps> = ({
  snapshot,
  trendOutput,
  onRunTrendIntelligence,
  onRefresh,
  isRunningTrendIntelligence,
  errorMessage,
  actionGate
}) => {
  const muiTheme = useMuiTheme()
  const { literal } = useLanguage()

  return (
    <Box sx={{ p: spacing.xl, maxWidth: '1200px', mx: 'auto' }}>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          mb: spacing.xl,
          gap: spacing.sm,
          flexWrap: 'wrap'
        }}
      >
        <Typography variant="h3" sx={{ color: muiTheme.palette.text.primary, flexGrow: 1 }}>
          {literal['executiveSuites.title']}
        </Typography>
        <Button variant="outlined" onClick={onRefresh}>
          {literal['executiveSuites.refresh']}
        </Button>
        <Button
          variant="contained"
          onClick={onRunTrendIntelligence}
          disabled={actionGate.isBlocked || isRunningTrendIntelligence}
        >
          {isRunningTrendIntelligence
            ? literal['executiveSuites.runningTrendIntelligence']
            : literal['executiveSuites.runTrendIntelligence']}
        </Button>
      </Box>

      <Typography variant="body1" sx={{ color: muiTheme.palette.text.secondary, mb: spacing.md }}>
        {literal['executiveSuites.subtitle']}
      </Typography>

      {actionGate.isBlocked && (
        <Alert severity="info" sx={{ mb: spacing.md }}>
          {actionGate.message}
        </Alert>
      )}
      {errorMessage && (
        <Alert severity="error" sx={{ mb: spacing.md }}>
          {errorMessage}
        </Alert>
      )}

      <Box
        sx={{
          p: spacing.lg,
          border: `1px solid ${muiTheme.palette.divider}`,
          borderRadius: spacing.xs,
          backgroundColor: muiTheme.palette.background.paper,
          mb: spacing.lg
        }}
      >
        <Typography variant="h6" sx={{ color: muiTheme.palette.text.primary, mb: spacing.sm }}>
          {literal['executiveSuites.integrationSnapshot']}
        </Typography>
        <Typography variant="body2" sx={{ color: muiTheme.palette.text.secondary }}>
          {literal['executiveSuites.mode']}: {snapshot?.mode ?? literal['global.na']}
        </Typography>
        <Typography variant="body2" sx={{ color: muiTheme.palette.text.secondary }}>
          {literal['executiveSuites.staffRows']}: {snapshot?.staffRegistry.rowCount ?? 0}
        </Typography>
        <Typography variant="body2" sx={{ color: muiTheme.palette.text.secondary }}>
          {literal['executiveSuites.feedbackResponses']}: {snapshot?.feedback.responseCount ?? 0}
        </Typography>
        <Typography variant="body2" sx={{ color: muiTheme.palette.text.secondary }}>
          {literal['executiveSuites.lastTrendSync']}:{' '}
          {snapshot?.lastSync.trends?.completedAt ?? literal['global.na']}
        </Typography>
      </Box>

      <Box
        sx={{
          p: spacing.lg,
          border: `1px solid ${muiTheme.palette.divider}`,
          borderRadius: spacing.xs,
          backgroundColor: muiTheme.palette.background.paper
        }}
      >
        <Typography variant="h6" sx={{ color: muiTheme.palette.text.primary, mb: spacing.sm }}>
          {literal['executiveSuites.socialTrendOutput']}
        </Typography>

        {!trendOutput ? (
          <Typography variant="body2" sx={{ color: muiTheme.palette.text.secondary }}>
            {literal['executiveSuites.noTrendOutput']}
          </Typography>
        ) : (
          <Stack spacing={spacing.md}>
            <Box sx={{ display: 'flex', gap: spacing.sm, flexWrap: 'wrap' }}>
              <Chip
                label={`${literal['executiveSuites.trendCount']}: ${trendOutput.summary.trendCount}`}
              />
              <Chip
                label={`${literal['executiveSuites.policySignals']}: ${trendOutput.summary.policySignals}`}
              />
              <Chip
                label={`${literal['executiveSuites.escalations']}: ${trendOutput.summary.escalations}`}
                color="warning"
              />
            </Box>

            <Typography variant="caption" sx={{ color: muiTheme.palette.text.secondary }}>
              {literal['executiveSuites.generatedAt']}:{' '}
              {new Date(trendOutput.generatedAt).toLocaleString()}
            </Typography>

            <Divider />

            <Stack spacing={spacing.sm}>
              {trendOutput.recommendations.map((recommendation) => (
                <Box
                  key={`${recommendation.topic}-${recommendation.recommendedPolicyArea}`}
                  sx={{
                    p: spacing.md,
                    border: `1px solid ${muiTheme.palette.divider}`,
                    borderRadius: spacing.xs,
                    backgroundColor: muiTheme.palette.background.default
                  }}
                >
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: spacing.sm,
                      flexWrap: 'wrap'
                    }}
                  >
                    <Typography variant="body2Bold" sx={{ color: muiTheme.palette.text.primary }}>
                      {recommendation.topic}
                    </Typography>
                    <Chip
                      size="small"
                      label={recommendation.risk}
                      color={getRiskColor(recommendation.risk)}
                    />
                    {recommendation.escalationRequired && (
                      <Chip
                        size="small"
                        label={literal['executiveSuites.escalationRequired']}
                        color="error"
                        variant="outlined"
                      />
                    )}
                  </Box>

                  <Typography
                    variant="body2"
                    sx={{ color: muiTheme.palette.text.secondary, mt: spacing.xs }}
                  >
                    {recommendation.rationale}
                  </Typography>

                  <Typography
                    variant="captionBold"
                    sx={{ color: muiTheme.palette.text.primary, mt: spacing.xs, display: 'block' }}
                  >
                    {literal['executiveSuites.policyArea']}: {recommendation.recommendedPolicyArea}
                  </Typography>

                  <Typography
                    variant="caption"
                    sx={{
                      color: muiTheme.palette.text.secondary,
                      mt: spacing.xs,
                      display: 'block'
                    }}
                  >
                    {recommendation.recommendedActions.join(' | ')}
                  </Typography>
                </Box>
              ))}
            </Stack>
          </Stack>
        )}
      </Box>
    </Box>
  )
}
