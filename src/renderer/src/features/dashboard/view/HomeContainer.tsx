import { FC, useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { HomeView, AppRecord } from './HomeView'

export const HomeContainer: FC = () => {
  const navigate = useNavigate()
  const email = localStorage.getItem('chakra_employee_email') ?? ''
  const employeeName = email.split('@')[0] ?? ''

  const [isLoading, setIsLoading] = useState(true)
  const [installedApps, setInstalledApps] = useState<AppRecord[]>([])
  const [availableApps, setAvailableApps] = useState<AppRecord[]>([])
  const [error, setError] = useState<string | null>(null)
  const [uninstallingAppId, setUninstallingAppId] = useState<string | null>(null)

  const loadApps = useCallback(async () => {
    if (!email) {
      setError('No session found. Please log in again.')
      setIsLoading(false)
      return
    }
    setIsLoading(true)
    setError(null)
    try {
      const result = await window.api.apps.getUserApps(email)
      if (!result.success) {
        setError(result.error ?? 'Failed to load apps')
        setInstalledApps([])
        setAvailableApps([])
      } else {
        setInstalledApps(result.apps.filter(a => a.isInstalled))
        setAvailableApps(result.apps.filter(a => !a.isInstalled))
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error loading apps')
    } finally {
      setIsLoading(false)
    }
  }, [email])

  useEffect(() => {
    loadApps()
  }, [loadApps])

  const handleInstall = (app: AppRecord) => {
    if (!app.cloneUrl) {
      setError(`App "${app.name}" has no repository URL configured.`)
      return
    }
    // Navigate to the dedicated install screen
    navigate('/app-install', { state: { appId: app.id, appName: app.name, cloneUrl: app.cloneUrl } })
  }

  const handleLaunch = (appId: string) => {
    const app = installedApps.find(a => a.id === appId)
    navigate(`/app-runner/${appId}?name=${encodeURIComponent(app?.name ?? appId)}`)
  }

  const handleUninstall = async (appId: string) => {
    setUninstallingAppId(appId)
    setError(null)
    try {
      const result = await window.api.apps.uninstall(appId)
      if (!result.success) {
        setError(result.error ?? 'Failed to uninstall app')
      } else {
        await loadApps()
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Uninstall failed')
    } finally {
      setUninstallingAppId(null)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('chakra_employee_email')
    localStorage.removeItem('chakra_session')
    navigate('/login')
  }

  return (
    <HomeView
      employeeName={employeeName}
      installedApps={installedApps}
      availableApps={availableApps}
      isLoading={isLoading}
      installingAppId={null}
      launchingAppId={null}
      uninstallingAppId={uninstallingAppId}
      error={error}
      onInstall={handleInstall}
      onLaunch={handleLaunch}
      onUninstall={handleUninstall}
      onLogout={handleLogout}
    />
  )
}
