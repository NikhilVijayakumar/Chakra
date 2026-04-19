import { FC } from 'react'
import { Box, Typography, Button, useTheme as useMuiTheme } from '@mui/material'
import { useLanguage } from 'astra'
import { spacing } from 'astra'
import { NotificationPayload } from '../repo/NotificationRepo'
import { AlertListItem, PageHeader } from 'astra/components'

interface NotificationProps {
  payload: NotificationPayload | null
  isLoading: boolean
  onRefresh: () => void
}

export const NotificationView: FC<NotificationProps> = ({ payload, isLoading, onRefresh }) => {
  const muiTheme = useMuiTheme()
  const { literal } = useLanguage()

  return (
    <Box sx={{ p: spacing.xl, maxWidth: '1000px', mx: 'auto', animation: 'fadeIn 0.4s ease-out' }}>
      <PageHeader
        title={literal['notifications.title']}
        subtitle={literal['notifications.subtitle']}
        primaryAction={{
          label: isLoading
            ? literal['notifications.fetching']
            : literal['notifications.refreshLogs'],
          onClick: onRefresh,
          disabled: isLoading,
          variant: 'outlined',
          size: 'small'
        }}
      />

      {payload && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: spacing.lg }}>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-end',
              borderBottom: `1px solid ${muiTheme.palette.divider}`,
              pb: spacing.sm
            }}
          >
            <Typography variant="h6" sx={{ color: muiTheme.palette.text.primary }}>
              {literal['notifications.activeAlerts']}{' '}
              <Typography
                component="span"
                variant="captionBold"
                sx={{
                  ml: spacing.sm,
                  px: spacing.sm,
                  py: spacing.internal,
                  borderRadius: spacing.sm,
                  backgroundColor:
                    payload.unreadCount > 0
                      ? muiTheme.palette.error.main
                      : `${muiTheme.palette.text.secondary}40`,
                  color:
                    payload.unreadCount > 0
                      ? muiTheme.palette.error.contrastText
                      : muiTheme.palette.text.primary
                }}
              >
                {payload.unreadCount} {literal['notifications.unread']}
              </Typography>
            </Typography>
            <Button variant="text" size="small" sx={{ color: muiTheme.palette.text.secondary }}>
              {literal['notifications.markAllRead']}
            </Button>
          </Box>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: spacing.sm }}>
            {payload.items.map((item) => (
              <AlertListItem
                key={item.id}
                id={item.id}
                source={item.source}
                timestamp={item.timestamp}
                message={item.message}
                severity={item.severity}
                read={item.read}
              />
            ))}
          </Box>
        </Box>
      )}
    </Box>
  )
}
