import { FC, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { HomeView, AppItem } from './HomeView'

/**
 * HomeContainer
 * 
 * Dashboard home screen container managing:
 * - App installation state
 * - Virtual drive usage
 * - Navigation
 * - Session management
 * 
 * TODO: Replace mock data with actual API calls
 */
export const HomeContainer: FC = () => {
  const navigate = useNavigate()
  const [currentSection, setCurrentSection] = useState('dashboard')
  const [isLoading, setIsLoading] = useState(false)
  const [apps] = useState<AppItem[]>([
    {
      id: 'app-1',
      name: 'Documents',
      description: 'Manage and organize your documents',
      status: 'installed',
      version: '1.0.0',
      lastUpdated: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    },
    {
      id: 'app-2',
      name: 'Media Hub',
      description: 'Access your photos and videos',
      status: 'installed',
      version: '2.1.0',
      lastUpdated: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
    },
    {
      id: 'app-3',
      name: 'Sync Manager',
      description: 'Sync files across devices',
      status: 'installing',
      version: '1.5.0'
    }
  ])
  const [virtualDriveSize] = useState(1099511627776) // 1 TB
  const [virtualDriveUsed] = useState(549755813888) // 500 GB

  // Initialize from session/cache
  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    setIsLoading(true)
    try {
      // TODO: Call API to get:
      // - GET /api/apps/list
      // - GET /api/storage/usage
      // - GET /api/session/validate

      // For now, use mock data
      await new Promise((r) => setTimeout(r, 500))
    } catch (err) {
      console.error('Failed to load dashboard:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleInstallApp = (appId: string) => {
    navigate('/app-install', { state: { appId } })
  }

  const handleOpenApp = (appId: string) => {
    // TODO: Implement IPC call to launch app
    console.log('Opening app:', appId)
    // window.api.apps.launch(appId)
  }

  const handleManageVirtualDrive = () => {
    navigate('/virtual-drive')
  }

  const handleSettings = () => {
    navigate('/settings')
  }

  const handleLogout = () => {
    // Clear session
    localStorage.removeItem('chakra_session')
    navigate('/login')
  }

  const handleNavigate = (section: string) => {
    setCurrentSection(section)
    if (section === 'virtual-drive') {
      navigate('/virtual-drive')
    } else if (section === 'settings') {
      navigate('/settings')
    }
  }

  return (
    <HomeView
      apps={apps}
      virtualDriveSize={virtualDriveSize}
      virtualDriveUsed={virtualDriveUsed}
      isLoading={isLoading}
      onInstallApp={handleInstallApp}
      onOpenApp={handleOpenApp}
      onManageVirtualDrive={handleManageVirtualDrive}
      onSettings={handleSettings}
      onLogout={handleLogout}
      onNavigate={handleNavigate}
      currentSection={currentSection}
    />
  )
}
