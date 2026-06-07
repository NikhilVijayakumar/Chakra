import { type FC } from 'react'
import { Box, Button, Typography } from '@mui/material'
import { useNavigate } from 'react-router-dom'

export const AccessDeniedContainer: FC = () => {
  const navigate = useNavigate()
  return (
    <Box sx={{ display: 'grid', placeItems: 'center', minHeight: '100vh', gap: 2 }}>
      <Box sx={{ textAlign: 'center' }}>
        <Typography variant="h4" gutterBottom>Access Denied</Typography>
        <Typography variant="body1" color="text.secondary" gutterBottom>
          You do not have permission to view this page.
        </Typography>
        <Button variant="outlined" onClick={() => navigate('/home')}>Go Home</Button>
      </Box>
    </Box>
  )
}
