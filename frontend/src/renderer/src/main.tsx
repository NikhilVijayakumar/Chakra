import { CssBaseline, ThemeProvider, createTheme, Typography, Button } from '@mui/material'
import React from 'react'
import ReactDOM from 'react-dom/client'
import { ChakraGate } from '../../lib'

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <ThemeProvider theme={createTheme({ palette: { mode: 'dark' } })}>
      <CssBaseline />
      <ChakraGate>
        {({ user, app, logout }) => (
          <div style={{ padding: 24 }}>
            <Typography variant="h5">Hello {user.name}</Typography>
            <Typography>App {app.appId} · features: {app.features.join(', ') || 'none'}</Typography>
            <Button onClick={logout}>Sign out</Button>
          </div>
        )}
      </ChakraGate>
    </ThemeProvider>
  </React.StrictMode>
)
