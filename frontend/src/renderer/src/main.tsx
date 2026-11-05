import { Button, CssBaseline, List, ListItem, Stack, TextField, ThemeProvider, Typography, createTheme } from '@mui/material'
import React, { useState } from 'react'
import ReactDOM from 'react-dom/client'
import { ChakraGate, useContent, useContentMutations } from '../../library'

/** Reference use of the data hooks: list, add and remove departments. Edits stay local until a sync. */
const Departments = (): React.JSX.Element => {
  const { rows, error, reload } = useContent('departments')
  const { create, remove } = useContentMutations('departments', () => void reload())
  const [name, setName] = useState('')
  const [problem, setProblem] = useState<string | null>(null)
  return (
    <div data-testid="departments">
      <Typography variant="h6">Departments</Typography>
      {(error || problem) && <Typography color="error">{error ?? problem}</Typography>}
      <List>
        {rows.map((d) => (
          <ListItem key={d.id} secondaryAction={<Button aria-label={`delete ${d.name}`} onClick={() => void remove(d.id)}>Delete</Button>}>
            {d.name}
          </ListItem>
        ))}
      </List>
      <Stack direction="row" spacing={1}>
        <TextField size="small" label="New department" value={name} onChange={(e) => setName(e.target.value)} />
        <Button
          onClick={async () => {
            const r = await create({ name, status: 'active' })
            setProblem(r.error)
            if (r.ok) setName('')
          }}
        >
          Add
        </Button>
      </Stack>
    </div>
  )
}

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <ThemeProvider theme={createTheme({ palette: { mode: 'dark' } })}>
      <CssBaseline />
      <ChakraGate>
        {({ user, app, logout }) => (
          <div style={{ padding: 24 }}>
            <Typography variant="h5">Hello {user.name}</Typography>
            <Typography>App {app.appId} · features: {app.features.join(', ') || 'none'}</Typography>
            <Departments />
            <Button onClick={logout}>Sign out</Button>
          </div>
        )}
      </ChakraGate>
    </ThemeProvider>
  </React.StrictMode>
)
