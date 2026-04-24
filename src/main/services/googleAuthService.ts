import { createServer, type IncomingMessage, type ServerResponse } from 'node:http'
import { shell } from 'electron'
import {
  loadStoredGoogleAuth,
  saveGoogleAuthTokens,
  clearGoogleAuthTokens,
  saveEmployeeSheetId
} from './employeeStoreService'

const OAUTH_PORT = 7234
const REDIRECT_URI = `http://localhost:${OAUTH_PORT}/oauth/callback`
const SCOPES = ['https://www.googleapis.com/auth/spreadsheets.readonly']
const OAUTH_TIMEOUT_MS = 5 * 60 * 1000

export interface GoogleAuthStatus {
  authenticated: boolean
  employee_sheet_id?: string
}

const isTokenExpired = (expiryDate: number): boolean => Date.now() >= expiryDate - 60_000

const refreshAccessToken = async (
  clientId: string,
  clientSecret: string,
  refreshToken: string
): Promise<{ access_token: string; expiry_date: number }> => {
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token'
    }).toString()
  })

  if (!res.ok) throw new Error(`Token refresh failed: ${await res.text()}`)

  const data = (await res.json()) as { access_token: string; expires_in: number }
  return {
    access_token: data.access_token,
    expiry_date: Date.now() + data.expires_in * 1000
  }
}

export const getValidAccessToken = async (
  clientId: string,
  clientSecret: string
): Promise<string | null> => {
  const stored = await loadStoredGoogleAuth()
  if (!stored.refresh_token) return null

  if (stored.access_token && stored.expiry_date && !isTokenExpired(stored.expiry_date)) {
    return stored.access_token
  }

  try {
    const refreshed = await refreshAccessToken(clientId, clientSecret, stored.refresh_token)
    await saveGoogleAuthTokens({ ...refreshed, refresh_token: stored.refresh_token })
    return refreshed.access_token
  } catch (err) {
    console.warn('[Chakra] Google token refresh failed:', err)
    return null
  }
}

const buildAuthUrl = (clientId: string, state: string): string => {
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: REDIRECT_URI,
    response_type: 'code',
    scope: SCOPES.join(' '),
    access_type: 'offline',
    prompt: 'consent',
    state
  })
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`
}

const exchangeCode = async (
  clientId: string,
  clientSecret: string,
  code: string
): Promise<{ access_token: string; refresh_token: string; expiry_date: number }> => {
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: REDIRECT_URI,
      code,
      grant_type: 'authorization_code'
    }).toString()
  })

  if (!res.ok) throw new Error(`Code exchange failed: ${await res.text()}`)

  const data = (await res.json()) as {
    access_token: string
    refresh_token: string
    expires_in: number
  }
  return {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expiry_date: Date.now() + data.expires_in * 1000
  }
}

export const runOAuthFlow = async (
  clientId: string,
  clientSecret: string
): Promise<{ success: boolean; error?: string }> => {
  const state = Math.random().toString(36).slice(2)
  const authUrl = buildAuthUrl(clientId, state)

  return new Promise((resolve) => {
    let settled = false

    const timer = setTimeout(() => {
      if (settled) return
      settled = true
      server.close()
      resolve({ success: false, error: 'OAuth flow timed out after 5 minutes.' })
    }, OAUTH_TIMEOUT_MS)

    const server = createServer(async (req: IncomingMessage, res: ServerResponse) => {
      if (!req.url?.startsWith('/oauth/callback')) {
        res.writeHead(404); res.end(); return
      }

      const url = new URL(req.url, `http://localhost:${OAUTH_PORT}`)
      const code = url.searchParams.get('code')
      const returnedState = url.searchParams.get('state')
      const error = url.searchParams.get('error')

      res.writeHead(200, { 'Content-Type': 'text/html' })
      res.end(
        '<html><body style="font-family:sans-serif;text-align:center;padding:40px">' +
        '<h2>Authorization complete — you can close this tab.</h2>' +
        '</body></html>'
      )
      server.close()
      clearTimeout(timer)
      if (settled) return
      settled = true

      if (error) { resolve({ success: false, error: `Google denied access: ${error}` }); return }
      if (!code || returnedState !== state) {
        resolve({ success: false, error: 'Invalid OAuth callback parameters.' }); return
      }

      try {
        const tokens = await exchangeCode(clientId, clientSecret, code)
        await saveGoogleAuthTokens(tokens)
        resolve({ success: true })
      } catch (err) {
        resolve({ success: false, error: err instanceof Error ? err.message : String(err) })
      }
    })

    server.listen(OAUTH_PORT, '127.0.0.1', () => {
      shell.openExternal(authUrl).catch((err) => {
        console.warn('[Chakra] Could not open OAuth URL:', err)
      })
    })

    server.on('error', (err) => {
      if (settled) return
      settled = true
      clearTimeout(timer)
      resolve({ success: false, error: `Could not start OAuth listener: ${err.message}` })
    })
  })
}

export const getAuthStatus = async (
  clientId: string,
  clientSecret: string
): Promise<GoogleAuthStatus> => {
  const stored = await loadStoredGoogleAuth()
  if (!stored.refresh_token) return { authenticated: false }

  const token = await getValidAccessToken(clientId, clientSecret)
  return {
    authenticated: !!token,
    employee_sheet_id: stored.employee_sheet_id
  }
}

export { saveEmployeeSheetId, clearGoogleAuthTokens as clearStoredAuth }
