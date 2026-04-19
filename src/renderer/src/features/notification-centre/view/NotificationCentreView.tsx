import React from 'react'
import {
  Box,
  Button,
  Paper,
  Typography,
  Chip,
  Stack,
  Link,
  CircularProgress,
  Alert
} from '@mui/material'
import { useLanguage } from 'astra'
import { NotificationItem } from '../repo/NotificationCentreRepo'

interface NotificationCentreViewProps {
  items: NotificationItem[]
  unreadCount: number
  filterSeverity: string
  isMarkingAsRead: boolean
  isLoading: boolean
  error: string | null
  onFilterChange: (severity: string) => void
  onMarkAsRead: (id: string) => void
  onMarkAllAsRead: () => void
  onRefresh: () => void
}

/**
 * NotificationCentreView: Pure stateless UI component
 * - Displays notifications in a list
 * - Shows severity filters (All, Critical, Warning, Info)
 * - Renders loading spinner and error state
 * - Manages mark-as-read interaction
 */
const NotificationCentreView: React.FC<NotificationCentreViewProps> = ({
  items,
  unreadCount,
  filterSeverity,
  isMarkingAsRead,
  isLoading,
  error,
  onFilterChange,
  onMarkAsRead,
  onMarkAllAsRead,
  onRefresh
}) => {
  const { literal } = useLanguage()

  // Map severity to MUI color
  const getSeverityColor = (severity: string): 'error' | 'warning' | 'info' =>
    severity === 'critical' ? 'error' : severity === 'warning' ? 'warning' : 'info'

  // Render loading state
  if (isLoading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: 300
        }}
      >
        <CircularProgress />
      </Box>
    )
  }

  // Render error state
  if (error) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        {error}
      </Alert>
    )
  }

  // Render empty state
  if (items.length === 0) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="body2" color="textSecondary">
          {literal['notifications.empty'] || 'No notifications'}
        </Typography>
      </Box>
    )
  }

  return (
    <Box sx={{ p: 2 }}>
      {/* Header */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h5" sx={{ mb: 1 }}>
            {literal['notifications.title'] || 'Notifications'}
          </Typography>
          <Typography variant="caption" color="textSecondary">
            {unreadCount > 0
              ? `${unreadCount} ${literal['notifications.unread'] || 'unread'}`
              : literal['notifications.allRead'] || 'All read'}
          </Typography>
        </Box>
        {unreadCount > 0 && (
          <Button
            size="small"
            variant="outlined"
            onClick={onMarkAllAsRead}
            disabled={isMarkingAsRead}
          >
            {literal['notifications.markAllRead'] || 'Mark all as read'}
          </Button>
        )}
      </Box>

      {/* Severity Filters */}
      <Stack direction="row" spacing={1} sx={{ mb: 3 }}>
        {['all', 'critical', 'warning', 'info'].map((severity) => (
          <Chip
            key={severity}
            label={
              severity === 'all'
                ? literal['notifications.filterAll'] || 'All'
                : severity.charAt(0).toUpperCase() + severity.slice(1)
            }
            onClick={() => onFilterChange(severity)}
            color={filterSeverity === severity ? 'primary' : 'default'}
            variant={filterSeverity === severity ? 'filled' : 'outlined'}
          />
        ))}
      </Stack>

      {/* Notification List */}
      <Stack spacing={2}>
        {items.map((notification) => (
          <Paper key={notification.id} sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
              <Box sx={{ flex: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                    {notification.title}
                  </Typography>
                  <Chip
                    size="small"
                    label={
                      notification.severity.charAt(0).toUpperCase() + notification.severity.slice(1)
                    }
                    color={getSeverityColor(notification.severity)}
                    variant="outlined"
                  />
                  {!notification.read && (
                    <Box
                      sx={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        bgcolor: 'primary.main'
                      }}
                    />
                  )}
                </Box>
                <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
                  {notification.message}
                </Typography>
                <Typography variant="caption" color="textDisabled">
                  {new Date(notification.createdAt).toLocaleString()}
                </Typography>
                {notification.actionLink && (
                  <Box sx={{ mt: 1 }}>
                    <Link href={notification.actionLink} underline="hover">
                      {literal['notifications.viewDetails'] || 'View Details'}
                    </Link>
                  </Box>
                )}
              </Box>
              <Button
                size="small"
                variant={notification.read ? 'outlined' : 'contained'}
                onClick={() => onMarkAsRead(notification.id)}
                disabled={isMarkingAsRead}
              >
                {notification.read
                  ? literal['notifications.read'] || 'Read'
                  : literal['notifications.unread'] || 'Unread'}
              </Button>
            </Box>
          </Paper>
        ))}
      </Stack>

      {/* Refresh Button */}
      <Box sx={{ mt: 3, textAlign: 'center' }}>
        <Button variant="contained" onClick={onRefresh} disabled={isLoading || isMarkingAsRead}>
          {literal['notifications.refresh'] || 'Refresh'}
        </Button>
      </Box>
    </Box>
  )
}

export default NotificationCentreView
