import { FC } from 'react'
import { Alert, Box, Typography, Button, useTheme as useMuiTheme } from '@mui/material'
import { useLanguage } from 'astra'
import { spacing } from 'astra'
import type { OnboardingActionGate } from 'prana/ui/hooks/useOnboardingActionGate'
import type { SkillEntry } from 'prana/ui/repo/skills'
import { AgentProfile } from '../repo/SuiteRepo'
import { PageHeader, StatusDot } from 'astra/components'

interface SuiteViewProps {
  agents: AgentProfile[] | null
  skills: SkillEntry[]
  onRunSkill: (skillId: string) => void
  executionLog: string
  actionGate: OnboardingActionGate
}

export const SuiteView: FC<SuiteViewProps> = ({
  agents,
  skills,
  onRunSkill,
  executionLog,
  actionGate
}) => {
  const muiTheme = useMuiTheme()
  const { literal } = useLanguage()

  return (
    <Box sx={{ p: spacing.xl, maxWidth: '1200px', mx: 'auto' }}>
      <PageHeader
        title={literal['nav.suites']}
        primaryAction={{
          label: literal['suites.deploy'],
          disabled: actionGate.isBlocked,
          variant: 'contained',
          size: 'small'
        }}
      />

      {actionGate.isBlocked && (
        <Alert severity="info" sx={{ mb: spacing.md }}>
          {actionGate.message}
        </Alert>
      )}

      <Typography variant="body1" sx={{ color: muiTheme.palette.text.secondary, mb: spacing.xl }}>
        {literal['suites.description']}
      </Typography>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' },
          gap: spacing.lg
        }}
      >
        {agents?.map((agent) => (
          <Box
            key={agent.id}
            sx={{
              p: spacing.lg,
              border: `1px solid ${muiTheme.palette.divider}`,
              borderRadius: spacing.xs,
              backgroundColor: muiTheme.palette.background.paper,
              display: 'flex',
              flexDirection: 'column',
              height: '100%',
              transition: 'transform 0.2s',
              cursor: 'pointer',
              '&:hover': {
                transform: 'translateY(-2px)',
                borderColor: muiTheme.palette.primary.main
              }
            }}
          >
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                mb: spacing.sm
              }}
            >
              <Typography variant="h6" sx={{ color: muiTheme.palette.text.primary }}>
                {agent.name}
              </Typography>
              <Typography variant="monoCaption" sx={{ color: muiTheme.palette.text.secondary }}>
                {agent.id}
              </Typography>
            </Box>

            <Typography
              variant="body2"
              sx={{ color: muiTheme.palette.text.secondary, mb: spacing.md, flexGrow: 1 }}
            >
              {agent.role}
            </Typography>

            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                mt: 'auto',
                pt: spacing.md,
                borderTop: `1px solid ${muiTheme.palette.divider}`
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: spacing.sm }}>
                <StatusDot
                  tone={
                    agent.status === 'EXECUTING'
                      ? 'executing'
                      : agent.status === 'WAITING'
                        ? 'waiting'
                        : 'default'
                  }
                  size={6}
                />
                <Typography variant="caption" sx={{ color: muiTheme.palette.text.primary }}>
                  {agent.status}
                </Typography>
              </Box>
              <Typography variant="caption" sx={{ color: muiTheme.palette.text.secondary }}>
                {agent.subAgents} {literal['suites.subs']}
              </Typography>
            </Box>
          </Box>
        ))}
      </Box>

      <Box sx={{ mt: spacing.xxl }}>
        <Typography variant="h5" sx={{ color: muiTheme.palette.text.primary, mb: spacing.md }}>
          Skill Registry
        </Typography>
        <Typography variant="body2" sx={{ color: muiTheme.palette.text.secondary, mb: spacing.lg }}>
          Loaded from workspace SKILL manifests with eligibility checks.
        </Typography>

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' },
            gap: spacing.md
          }}
        >
          {skills.map((skill) => (
            <Box
              key={skill.id}
              sx={{
                p: spacing.md,
                border: `1px solid ${muiTheme.palette.divider}`,
                borderRadius: spacing.xs,
                backgroundColor: muiTheme.palette.background.paper
              }}
            >
              <Box
                sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}
              >
                <Typography variant="body2Bold" sx={{ color: muiTheme.palette.text.primary }}>
                  {skill.manifest.name}
                </Typography>
                <Typography
                  variant="captionBold"
                  sx={{
                    color: skill.eligible
                      ? muiTheme.palette.success.main
                      : muiTheme.palette.warning.main
                  }}
                >
                  {skill.eligible ? 'ELIGIBLE' : 'BLOCKED'}
                </Typography>
              </Box>
              <Typography
                variant="caption"
                sx={{ color: muiTheme.palette.text.secondary, display: 'block', mt: spacing.xs }}
              >
                {skill.manifest.description}
              </Typography>
              {!skill.eligible && (
                <Typography
                  variant="caption"
                  sx={{ color: muiTheme.palette.warning.main, display: 'block', mt: spacing.xs }}
                >
                  {skill.ineligibilityReasons.join(' | ')}
                </Typography>
              )}
              <Box sx={{ mt: spacing.sm, display: 'flex', justifyContent: 'flex-end' }}>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => onRunSkill(skill.id)}
                  disabled={!skill.eligible || actionGate.isBlocked}
                >
                  Run Skill
                </Button>
              </Box>
            </Box>
          ))}
        </Box>

        <Box
          sx={{
            mt: spacing.lg,
            p: spacing.md,
            border: `1px solid ${muiTheme.palette.divider}`,
            borderRadius: spacing.xs,
            backgroundColor: muiTheme.palette.background.paper
          }}
        >
          <Typography variant="captionBold" sx={{ color: muiTheme.palette.text.secondary }}>
            LAST SKILL OUTPUT
          </Typography>
          <Typography
            variant="monoBody"
            sx={{ color: muiTheme.palette.text.primary, mt: spacing.xs }}
          >
            {executionLog}
          </Typography>
        </Box>
      </Box>
    </Box>
  )
}
