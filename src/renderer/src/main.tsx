import React from 'react'
import ReactDOM from 'react-dom/client'
import { Suspense, lazy } from 'react'
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ThemeProvider, LanguageProvider } from 'astra'
import { translations, availableLanguages, DEFAULT_LANGUAGE } from './localization/i18n'
import { lightTheme, darkTheme } from 'astra'
import { Box, CircularProgress, Stack, Typography } from '@mui/material'
import { MainAppGuard, PublicOnlyGuard } from 'prana/ui/components/AuthGuard'
import { ResetPasswordContainer as PranaResetPasswordContainer } from 'prana/ui/authentication/view/ResetPasswordContainer'
import { AccessDeniedContainer } from 'prana/ui/authentication/view/AccessDeniedContainer'
import { BootContainer } from './features/boot-feature/view/BootContainer'
import { LoginContainer } from './features/authentication/view/LoginContainer'
import { ForgotPasswordContainer } from './features/authentication/view/ForgotPasswordContainer'
import { HomeContainer } from './features/dashboard/view/HomeContainer'
import { AppInstallContainer } from './features/app-install/view/AppInstallContainer'
import { AppRunnerContainer } from './features/app-runner/view/AppRunnerContainer'
import { VirtualDriveContainer } from './features/virtual-drive/view/VirtualDriveContainer'
import { SplashContainerOverride } from './features/splash-override/view/SplashContainerOverride'
import { volatileSessionStore } from 'prana/ui/state/volatileSessionStore'
import { setManifestProvider } from 'prana/ui/constants/manifestBridge'
import { BrandingProvider } from 'prana/ui/constants/pranaConfig'
import { listModuleManifests } from './shared/registry'
import { DHI_BRANDING } from '@renderer/common/constants/dhiBranding'
import { BrandedPreAuthLayout } from '@renderer/common/components/BrandedPreAuthLayout'
import './assets/main.css'

if (localStorage.getItem('darkMode') === null) {
  localStorage.setItem('darkMode', 'true')
}

setManifestProvider(listModuleManifests)
volatileSessionStore.purgeLegacyPersistentSessionArtifacts()
;(window as any).__pranaBrandingConfig = DHI_BRANDING

const loadNamedComponent = <TModule extends Record<string, React.ComponentType<{}>>>(
  loader: () => Promise<TModule>,
  exportName: keyof TModule
): React.LazyExoticComponent<React.ComponentType<{}>> => {
  return lazy(() => loader().then((module) => ({ default: module[exportName] })))
}

const DependencyCheckContainer = loadNamedComponent(
  () => import('@renderer/features/splash-override/view/DependencyCheckContainer'),
  'DependencyCheckContainer'
)

const RouteLoadingFallback = (): React.JSX.Element => (
  <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', px: 3 }}>
    <Stack spacing={2} alignItems="center">
      <CircularProgress />
      <Typography variant="body1">{translations[DEFAULT_LANGUAGE]['status.loading']}</Typography>
    </Stack>
  </Box>
)

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <LanguageProvider translations={translations} availableLanguages={availableLanguages} defaultLanguage={DEFAULT_LANGUAGE}>
      <ThemeProvider lightTheme={lightTheme} darkTheme={darkTheme}>
        <BrandingProvider>
          <HashRouter>
            <Suspense fallback={<RouteLoadingFallback />}>
              <Routes>
                {/* Boot sequence */}
                <Route path="/" element={<Navigate to="/splash" replace />} />
                <Route path="/splash" element={<SplashContainerOverride />} />
                <Route path="/boot" element={<BootContainer />} />
                <Route path="/dependency-check" element={<DependencyCheckContainer />} />

                {/* Public auth routes */}
                <Route path="/login" element={<PublicOnlyGuard><BrandedPreAuthLayout><LoginContainer /></BrandedPreAuthLayout></PublicOnlyGuard>} />
                <Route path="/forgot-password" element={<PublicOnlyGuard><BrandedPreAuthLayout><ForgotPasswordContainer /></BrandedPreAuthLayout></PublicOnlyGuard>} />
                <Route path="/reset-password" element={<PublicOnlyGuard><BrandedPreAuthLayout><PranaResetPasswordContainer /></BrandedPreAuthLayout></PublicOnlyGuard>} />
                <Route path="/access-denied" element={<MainAppGuard><AccessDeniedContainer /></MainAppGuard>} />

                {/* Authenticated app routes */}
                <Route path="/home" element={<MainAppGuard><HomeContainer /></MainAppGuard>} />
                <Route path="/app-install" element={<MainAppGuard><AppInstallContainer /></MainAppGuard>} />
                <Route path="/app-runner/:appId" element={<MainAppGuard><AppRunnerContainer /></MainAppGuard>} />
                <Route path="/virtual-drive" element={<MainAppGuard><VirtualDriveContainer /></MainAppGuard>} />

                {/* Catch-all fallback */}
                <Route path="*" element={<Navigate to="/home" replace />} />
              </Routes>
            </Suspense>
          </HashRouter>
        </BrandingProvider>
      </ThemeProvider>
    </LanguageProvider>
  </React.StrictMode>
)
