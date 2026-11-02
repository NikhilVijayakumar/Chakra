const SESSION_TOKEN_KEY = 'prana_volatile_session_token'

export const volatileSessionStore = {
  setSessionToken(token: string): void {
    sessionStorage.setItem(SESSION_TOKEN_KEY, token)
  },
  getSessionToken(): string | null {
    return sessionStorage.getItem(SESSION_TOKEN_KEY)
  },
  clearSessionToken(): void {
    sessionStorage.removeItem(SESSION_TOKEN_KEY)
  },
  purgeLegacyPersistentSessionArtifacts(): void {
    for (const key of Object.keys(localStorage)) {
      if (key.startsWith('prana_session_') || key.startsWith('dhi_session_')) {
        localStorage.removeItem(key)
      }
    }
  }
}
