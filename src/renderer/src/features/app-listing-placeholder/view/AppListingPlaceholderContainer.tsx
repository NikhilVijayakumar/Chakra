import { FC } from 'react'
import { Box, Button, Stack, Typography } from '@mui/material'

export const AppListingPlaceholderContainer: FC = () => {
  return (
    <Box sx={{ p: { xs: 3, md: 5 } }}>
      <Stack spacing={2.5} maxWidth={720}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 700 }}>
          Chakra App Listing
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Post-login now lands here. App listing and install workflows will be added in the next
          iteration.
        </Typography>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
          <Button variant="contained" disableElevation>
            Install App (Coming Soon)
          </Button>
          <Button variant="outlined">Browse Catalog (Coming Soon)</Button>
        </Stack>
      </Stack>
    </Box>
  )
}
