import { createSign } from 'node:crypto'
import { existsSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { getServiceAccountKeyPath } from './bootstrapConfigService'

const SCOPES = 'https://www.googleapis.com/auth/spreadsheets'

interface ServiceAccountKey {
  client_email: string
  private_key: string
  token_uri: string
}

interface TokenCache {
  token: string
  expiresAt: number
}

let tokenCache: TokenCache | null = null

const resolveKeyPath = (): string => {
  // Prefer the explicit path from chakra-runtime.json, fall back to well-known names.
  const configured = getServiceAccountKeyPath()
  if (configured && existsSync(configured)) return configured

  const candidates = [
    join(process.cwd(), 'config', 'chakra-service-account.json'),
    join(process.cwd(), 'config', 'chakra-494418-bddcc85e4c64.json'),
    join(process.resourcesPath ?? '', 'config', 'chakra-service-account.json'),
    join(process.resourcesPath ?? '', 'config', 'chakra-494418-bddcc85e4c64.json')
  ]
  for (const c of candidates) {
    if (existsSync(c)) return c
  }
  throw new Error('Google service account key not found. Set serviceAccountKeyPath in config/chakra-runtime.json')
}

const readKey = async (): Promise<ServiceAccountKey> =>
  JSON.parse(await readFile(resolveKeyPath(), 'utf-8')) as ServiceAccountKey

const b64url = (buf: Buffer): string =>
  buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')

const buildJwt = (key: ServiceAccountKey): string => {
  const now = Math.floor(Date.now() / 1000)
  const header = b64url(Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })))
  const payload = b64url(Buffer.from(JSON.stringify({
    iss: key.client_email,
    scope: SCOPES,
    aud: key.token_uri,
    exp: now + 3600,
    iat: now
  })))
  const unsigned = `${header}.${payload}`
  const signer = createSign('RSA-SHA256')
  signer.update(unsigned)
  return `${unsigned}.${b64url(signer.sign(key.private_key))}`
}

export const getServiceAccountToken = async (): Promise<string> => {
  if (tokenCache && Date.now() < tokenCache.expiresAt - 60_000) {
    return tokenCache.token
  }
  const key = await readKey()
  const jwt = buildJwt(key)
  const res = await fetch(key.token_uri, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt
    }).toString()
  })
  if (!res.ok) throw new Error(`Service account token exchange failed: ${await res.text()}`)
  const data = (await res.json()) as { access_token: string; expires_in: number }
  tokenCache = { token: data.access_token, expiresAt: Date.now() + data.expires_in * 1000 }
  return tokenCache.token
}

export interface ServiceAccountStatus {
  available: boolean
  email?: string
  error?: string
}

export const getServiceAccountStatus = async (): Promise<ServiceAccountStatus> => {
  try {
    const keyPath = resolveKeyPath()
    const key = JSON.parse(await readFile(keyPath, 'utf-8')) as ServiceAccountKey
    return { available: true, email: key.client_email }
  } catch (err) {
    return { available: false, error: err instanceof Error ? err.message : String(err) }
  }
}
