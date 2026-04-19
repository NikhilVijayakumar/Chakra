import React from 'react'
import ReactDOM from 'react-dom/client'
import { Suspense, lazy } from 'react'
import { HashRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom'
import { ThemeProvider, LanguageProvider } from 'astra'
import { translations, availableLanguages, DEFAULT_LANGUAGE } from './localization/i18n'
import { lightTheme, darkTheme } from 'astra'
import { Box, CircularProgress, Stack, Typography } from '@mui/material'
import { MainLayout } from 'prana/ui/layout/MainLayout'
import {
  MainAppGuard,
  ModuleRouteGuard,
  OnboardingGuard,
  PublicOnlyGuard
} from 'prana/ui/components/AuthGuard'
import { ForgotPasswordContainer } from 'prana/ui/authentication/view/ForgotPasswordContainer'
import { ResetPasswordContainer } from 'prana/ui/authentication/view/ResetPasswordContainer'
import { AccessDeniedContainer } from 'prana/ui/authentication/view/AccessDeniedContainer'
import { SplashContainerOverride as SplashContainer } from './features/splash-override/view/SplashContainerOverride'
import { LoginContainerOverride as LoginContainer } from './features/auth-override/view/LoginContainerOverride'
import { volatileSessionStore } from 'prana/ui/state/volatileSessionStore'
import { LifecycleProvider } from 'prana/ui/state/LifecycleProvider'
import { setManifestProvider } from 'prana/ui/constants/manifestBridge'
import { BrandingProvider } from 'prana/ui/constants/pranaConfig'
import { listModuleManifests } from './shared/registry'
import { DHI_BRANDING } from '@renderer/common/constants/dhiBranding'
import { BrandedPreAuthLayout } from '@renderer/common/components/BrandedPreAuthLayout'
import './assets/main.css'

// Enforce Dark Mode as the default if not previously set
if (localStorage.getItem('darkMode') === null) {
  localStorage.setItem('darkMode', 'true')
}

// Wire the manifest bridge so Astra's moduleRegistry receives real data
// without a direct @renderer import inside the design-system package.
setManifestProvider(listModuleManifests)

// Remove legacy persisted auth/onboarding artifacts; session is memory-only.
volatileSessionStore.purgeLegacyPersistentSessionArtifacts()

// Seed Dhi branding into the window global so Prana's BrandingProvider
// picks it up as its initial fallback value. The provider will also
// attempt to fetch from IPC (app:get-branding-config) and merge.
;(window as any).__pranaBrandingConfig = DHI_BRANDING

const RouteLoadingFallback = (): React.JSX.Element => {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        px: 3
      }}
    >
      <Stack spacing={2} alignItems="center">
        <CircularProgress />
        <Typography variant="body1">{translations[DEFAULT_LANGUAGE]['status.loading']}</Typography>
      </Stack>
    </Box>
  )
}

const LifecycleWrapper = (): React.JSX.Element => {
  return (
    <LifecycleProvider>
      <Outlet />
    </LifecycleProvider>
  )
}

const loadNamedComponent = <TModule extends Record<string, React.ComponentType<{}>>>(
  loader: () => Promise<TModule>,
  exportName: keyof TModule
): React.LazyExoticComponent<React.ComponentType<{}>> => {
  return lazy(() => loader().then((module) => ({ default: module[exportName] })))
}

const TriageContainer = loadNamedComponent(
  () => import('@renderer/features/triage/view/TriageContainer'),
  'TriageContainer'
)
const OnboardingContainer = loadNamedComponent(
  () => import('prana/ui/onboarding/view/OnboardingContainer'),
  'OnboardingContainer'
)
const DashboardContainer = loadNamedComponent(
  () => import('@renderer/features/dashboard/view/DashboardContainer'),
  'DashboardContainer'
)
const VaultContainer = loadNamedComponent(
  () => import('prana/ui/vault/view/VaultContainer'),
  'VaultContainer'
)
const SuiteContainer = loadNamedComponent(
  () => import('@renderer/features/suites/view/SuiteContainer'),
  'SuiteContainer'
)
const DailyBriefContainer = loadNamedComponent(
  () => import('@renderer/features/daily-brief/view/DailyBriefContainer'),
  'DailyBriefContainer'
)
const FundingDigestContainer = loadNamedComponent(
  () => import('@renderer/features/funding-digest/view/FundingDigestContainer'),
  'FundingDigestContainer'
)
const InfrastructureContainer = loadNamedComponent(
  () => import('prana/ui/infrastructure/view/InfrastructureContainer'),
  'InfrastructureContainer'
)
const NotificationContainer = loadNamedComponent(
  () => import('@renderer/features/notification-centre/view/NotificationContainer'),
  'NotificationContainer'
)
const VaultKnowledgeContainer = loadNamedComponent(
  () => import('prana/ui/vault-knowledge/view/VaultKnowledgeContainer'),
  'VaultKnowledgeContainer'
)
const WeeklyReviewContainer = loadNamedComponent(
  () => import('@renderer/features/weekly-review/view/WeeklyReviewContainer'),
  'WeeklyReviewContainer'
)
const EmployeeProfileContainer = loadNamedComponent(
  () => import('@renderer/features/employee-profiles/view/EmployeeProfileContainer'),
  'EmployeeProfileContainer'
)
const ChatExternalRoutingContainer = loadNamedComponent(
  () => import('@renderer/features/chat-external-routing/view/ChatExternalRoutingContainer'),
  'ChatExternalRoutingContainer'
)
const ChatInternalInterfaceContainer = loadNamedComponent(
  () => import('@renderer/features/chat-internal-interface/view/ChatInternalInterfaceContainer'),
  'ChatInternalInterfaceContainer'
)
const ExecutiveSuitesContainer = loadNamedComponent(
  () => import('@renderer/features/executive-suites/view/ExecutiveSuitesContainer'),
  'ExecutiveSuitesContainer'
)
const InfrastructureLayersContainer = loadNamedComponent(
  () => import('prana/ui/infrastructure-layers/view/InfrastructureLayersContainer'),
  'InfrastructureLayersContainer'
)
const KpiBreachAlertingContainer = loadNamedComponent(
  () => import('@renderer/features/kpi-breach-alerting/view/KpiBreachAlertingContainer'),
  'KpiBreachAlertingContainer'
)
const KpiVerificationCronContainer = loadNamedComponent(
  () => import('@renderer/features/kpi-verification-cron/view/KpiVerificationCronContainer'),
  'KpiVerificationCronContainer'
)
const NotificationCentreContainer = loadNamedComponent(
  () => import('@renderer/features/notification-centre/view/NotificationCentreContainer'),
  'NotificationCentreContainer'
)
const OnboardingChannelConfigurationContainer = loadNamedComponent(
  () =>
    import('prana/ui/onboarding-channel-configuration/view/OnboardingChannelConfigurationContainer'),
  'OnboardingChannelConfigurationContainer'
)
const OnboardingModelConfigurationContainer = loadNamedComponent(
  () =>
    import('prana/ui/onboarding-model-configuration/view/OnboardingModelConfigurationContainer'),
  'OnboardingModelConfigurationContainer'
)
const OnboardingRegistryApprovalContainer = loadNamedComponent(
  () => import('prana/ui/onboarding-registry-approval/view/OnboardingRegistryApprovalContainer'),
  'OnboardingRegistryApprovalContainer'
)
const ReportDailyBriefContainer = loadNamedComponent(
  () => import('@renderer/features/report-daily-brief/view/ReportDailyBriefContainer'),
  'ReportDailyBriefContainer'
)
const ReportFundingDigestContainer = loadNamedComponent(
  () => import('@renderer/features/report-funding-digest/view/ReportFundingDigestContainer'),
  'ReportFundingDigestContainer'
)
const ReportWeeklyReviewContainer = loadNamedComponent(
  () => import('@renderer/features/report-weekly-review/view/ReportWeeklyReviewContainer'),
  'ReportWeeklyReviewContainer'
)
const SplashSystemInitializationContainer = loadNamedComponent(
  () => import('prana/ui/splash-system-initialization/view/SplashSystemInitializationContainer'),
  'SplashSystemInitializationContainer'
)
const TriageIncidentResolutionContainer = loadNamedComponent(
  () =>
    import('@renderer/features/triage-incident-resolution/view/TriageIncidentResolutionContainer'),
  'TriageIncidentResolutionContainer'
)
const TriageIncidentRoutingContainer = loadNamedComponent(
  () => import('@renderer/features/triage-incident-routing/view/TriageIncidentRoutingContainer'),
  'TriageIncidentRoutingContainer'
)
const VaultFolderStructureContainer = loadNamedComponent(
  () => import('prana/ui/vault-folder-structure/view/VaultFolderStructureContainer'),
  'VaultFolderStructureContainer'
)
const VaultKnowledgeRepositoryContainer = loadNamedComponent(
  () => import('prana/ui/vault-knowledge-repository/view/VaultKnowledgeRepositoryContainer'),
  'VaultKnowledgeRepositoryContainer'
)
const ViewerMarkdownContainer = loadNamedComponent(
  () => import('prana/ui/viewer-markdown/view/ViewerMarkdownContainer'),
  'ViewerMarkdownContainer'
)
const ViewerPdfContainer = loadNamedComponent(
  () => import('prana/ui/viewer-pdf/view/ViewerPdfContainer'),
  'ViewerPdfContainer'
)
const VirtualEmployeeDashboardContainer = loadNamedComponent(
  () =>
    import('@renderer/features/virtual-employee-dashboard/view/VirtualEmployeeDashboardContainer'),
  'VirtualEmployeeDashboardContainer'
)
const CompanyContainer = loadNamedComponent(
  () => import('@renderer/features/company/view/CompanyContainer'),
  'CompanyContainer'
)
const ProductsContainer = loadNamedComponent(
  () => import('@renderer/features/products/view/ProductsContainer'),
  'ProductsContainer'
)
const AgentsContainer = loadNamedComponent(
  () => import('@renderer/features/agents/view/AgentsContainer'),
  'AgentsContainer'
)
const SkillsContainer = loadNamedComponent(
  () => import('@renderer/features/skills/view/SkillsContainer'),
  'SkillsContainer'
)
const ProtocolsContainer = loadNamedComponent(
  () => import('@renderer/features/protocols/view/ProtocolsContainer'),
  'ProtocolsContainer'
)
const WorkflowsContainer = loadNamedComponent(
  () => import('@renderer/features/workflows/view/WorkflowsContainer'),
  'WorkflowsContainer'
)
const KpisContainer = loadNamedComponent(
  () => import('@renderer/features/kpis/view/KpisContainer'),
  'KpisContainer'
)
const DataInputsContainer = loadNamedComponent(
  () => import('@renderer/features/data-inputs/view/DataInputsContainer'),
  'DataInputsContainer'
)

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <LanguageProvider
      translations={translations}
      availableLanguages={availableLanguages}
      defaultLanguage={DEFAULT_LANGUAGE}
    >
      <ThemeProvider lightTheme={lightTheme} darkTheme={darkTheme}>
        <BrandingProvider>
          <HashRouter>
            <Suspense fallback={<RouteLoadingFallback />}>
              <Routes>
                {/* Boot */}
                <Route path="/splash" element={<SplashContainer />} />
                <Route path="/" element={<Navigate to="/splash" replace />} />
                {/* Pre-auth — no session required */}
                <Route
                  path="/login"
                  element={
                    <PublicOnlyGuard>
                      <BrandedPreAuthLayout>
                        <LoginContainer />
                      </BrandedPreAuthLayout>
                    </PublicOnlyGuard>
                  }
                />
                <Route
                  path="/forgot-password"
                  element={
                    <PublicOnlyGuard>
                      <BrandedPreAuthLayout>
                        <ForgotPasswordContainer />
                      </BrandedPreAuthLayout>
                    </PublicOnlyGuard>
                  }
                />
                <Route
                  path="/reset-password"
                  element={
                    <PublicOnlyGuard>
                      <BrandedPreAuthLayout>
                        <ResetPasswordContainer />
                      </BrandedPreAuthLayout>
                    </PublicOnlyGuard>
                  }
                />
                <Route
                  path="/access-denied"
                  element={
                    <MainAppGuard>
                      <MainLayout>
                        <AccessDeniedContainer />
                      </MainLayout>
                    </MainAppGuard>
                  }
                />
                {/* Authenticated & Onboarding — guarded and requires Lifecycle */}
                <Route element={<LifecycleWrapper />}>
                  <Route
                    path="/onboarding"
                    element={
                      <OnboardingGuard>
                        <MainLayout>
                          <OnboardingContainer />
                        </MainLayout>
                      </OnboardingGuard>
                    }
                  />
                  <Route
                    path="/dashboard"
                    element={
                      <MainAppGuard>
                        <ModuleRouteGuard routePath="/dashboard">
                          <MainLayout>
                            <DashboardContainer />
                          </MainLayout>
                        </ModuleRouteGuard>
                      </MainAppGuard>
                    }
                  />
                  <Route
                    path="/triage"
                    element={
                      <MainAppGuard>
                        <ModuleRouteGuard routePath="/triage">
                          <MainLayout>
                            <TriageContainer />
                          </MainLayout>
                        </ModuleRouteGuard>
                      </MainAppGuard>
                    }
                  />
                  <Route
                    path="/vault"
                    element={
                      <MainAppGuard>
                        <ModuleRouteGuard routePath="/vault">
                          <MainLayout>
                            <VaultContainer />
                          </MainLayout>
                        </ModuleRouteGuard>
                      </MainAppGuard>
                    }
                  />
                  <Route
                    path="/suites"
                    element={
                      <MainAppGuard>
                        <ModuleRouteGuard routePath="/suites">
                          <MainLayout>
                            <SuiteContainer />
                          </MainLayout>
                        </ModuleRouteGuard>
                      </MainAppGuard>
                    }
                  />
                  <Route
                    path="/daily-brief"
                    element={
                      <MainAppGuard>
                        <ModuleRouteGuard routePath="/daily-brief">
                          <MainLayout>
                            <DailyBriefContainer />
                          </MainLayout>
                        </ModuleRouteGuard>
                      </MainAppGuard>
                    }
                  />
                  <Route
                    path="/funding-digest"
                    element={
                      <MainAppGuard>
                        <ModuleRouteGuard routePath="/funding-digest">
                          <MainLayout>
                            <FundingDigestContainer />
                          </MainLayout>
                        </ModuleRouteGuard>
                      </MainAppGuard>
                    }
                  />
                  <Route
                    path="/infrastructure"
                    element={
                      <MainAppGuard>
                        <ModuleRouteGuard routePath="/infrastructure">
                          <MainLayout>
                            <InfrastructureContainer />
                          </MainLayout>
                        </ModuleRouteGuard>
                      </MainAppGuard>
                    }
                  />
                  <Route
                    path="/notifications"
                    element={
                      <MainAppGuard>
                        <ModuleRouteGuard routePath="/notifications">
                          <MainLayout>
                            <NotificationContainer />
                          </MainLayout>
                        </ModuleRouteGuard>
                      </MainAppGuard>
                    }
                  />
                  <Route
                    path="/vault-knowledge"
                    element={
                      <MainAppGuard>
                        <ModuleRouteGuard routePath="/vault-knowledge">
                          <MainLayout>
                            <VaultKnowledgeContainer />
                          </MainLayout>
                        </ModuleRouteGuard>
                      </MainAppGuard>
                    }
                  />
                  <Route
                    path="/weekly-review"
                    element={
                      <MainAppGuard>
                        <ModuleRouteGuard routePath="/weekly-review">
                          <MainLayout>
                            <WeeklyReviewContainer />
                          </MainLayout>
                        </ModuleRouteGuard>
                      </MainAppGuard>
                    }
                  />
                  <Route
                    path="/profile/:id"
                    element={
                      <MainAppGuard>
                        <MainLayout>
                          <EmployeeProfileContainer />
                        </MainLayout>
                      </MainAppGuard>
                    }
                  />
                  <Route
                    path="/chat-external-routing"
                    element={
                      <MainAppGuard>
                        <MainLayout>
                          <ChatExternalRoutingContainer />
                        </MainLayout>
                      </MainAppGuard>
                    }
                  />
                  <Route
                    path="/chat-internal-interface"
                    element={
                      <MainAppGuard>
                        <MainLayout>
                          <ChatInternalInterfaceContainer />
                        </MainLayout>
                      </MainAppGuard>
                    }
                  />
                  <Route
                    path="/executive-suites"
                    element={
                      <MainAppGuard>
                        <MainLayout>
                          <ExecutiveSuitesContainer />
                        </MainLayout>
                      </MainAppGuard>
                    }
                  />
                  <Route
                    path="/infrastructure-layers"
                    element={
                      <MainAppGuard>
                        <MainLayout>
                          <InfrastructureLayersContainer />
                        </MainLayout>
                      </MainAppGuard>
                    }
                  />
                  <Route
                    path="/kpi-breach-alerting"
                    element={
                      <MainAppGuard>
                        <MainLayout>
                          <KpiBreachAlertingContainer />
                        </MainLayout>
                      </MainAppGuard>
                    }
                  />
                  <Route
                    path="/kpi-verification-cron"
                    element={
                      <MainAppGuard>
                        <MainLayout>
                          <KpiVerificationCronContainer />
                        </MainLayout>
                      </MainAppGuard>
                    }
                  />
                  <Route
                    path="/notification-centre"
                    element={
                      <MainAppGuard>
                        <MainLayout>
                          <NotificationCentreContainer />
                        </MainLayout>
                      </MainAppGuard>
                    }
                  />
                  <Route
                    path="/onboarding-channel-configuration"
                    element={
                      <MainAppGuard>
                        <MainLayout>
                          <OnboardingChannelConfigurationContainer />
                        </MainLayout>
                      </MainAppGuard>
                    }
                  />
                  <Route
                    path="/onboarding-model-configuration"
                    element={
                      <MainAppGuard>
                        <MainLayout>
                          <OnboardingModelConfigurationContainer />
                        </MainLayout>
                      </MainAppGuard>
                    }
                  />
                  <Route
                    path="/onboarding-registry-approval"
                    element={
                      <MainAppGuard>
                        <MainLayout>
                          <OnboardingRegistryApprovalContainer />
                        </MainLayout>
                      </MainAppGuard>
                    }
                  />
                  <Route
                    path="/report-daily-brief"
                    element={
                      <MainAppGuard>
                        <MainLayout>
                          <ReportDailyBriefContainer />
                        </MainLayout>
                      </MainAppGuard>
                    }
                  />
                  <Route
                    path="/report-funding-digest"
                    element={
                      <MainAppGuard>
                        <MainLayout>
                          <ReportFundingDigestContainer />
                        </MainLayout>
                      </MainAppGuard>
                    }
                  />
                  <Route
                    path="/report-weekly-review"
                    element={
                      <MainAppGuard>
                        <MainLayout>
                          <ReportWeeklyReviewContainer />
                        </MainLayout>
                      </MainAppGuard>
                    }
                  />
                  <Route
                    path="/splash-system-initialization"
                    element={
                      <MainAppGuard>
                        <MainLayout>
                          <SplashSystemInitializationContainer />
                        </MainLayout>
                      </MainAppGuard>
                    }
                  />
                  <Route
                    path="/triage-incident-resolution"
                    element={
                      <MainAppGuard>
                        <MainLayout>
                          <TriageIncidentResolutionContainer />
                        </MainLayout>
                      </MainAppGuard>
                    }
                  />
                  <Route
                    path="/triage-incident-routing"
                    element={
                      <MainAppGuard>
                        <MainLayout>
                          <TriageIncidentRoutingContainer />
                        </MainLayout>
                      </MainAppGuard>
                    }
                  />
                  <Route
                    path="/vault-folder-structure"
                    element={
                      <MainAppGuard>
                        <MainLayout>
                          <VaultFolderStructureContainer />
                        </MainLayout>
                      </MainAppGuard>
                    }
                  />
                  <Route
                    path="/vault-knowledge-repository"
                    element={
                      <MainAppGuard>
                        <MainLayout>
                          <VaultKnowledgeRepositoryContainer />
                        </MainLayout>
                      </MainAppGuard>
                    }
                  />
                  <Route
                    path="/viewer-markdown"
                    element={
                      <MainAppGuard>
                        <MainLayout>
                          <ViewerMarkdownContainer />
                        </MainLayout>
                      </MainAppGuard>
                    }
                  />
                  <Route
                    path="/viewer-pdf"
                    element={
                      <MainAppGuard>
                        <MainLayout>
                          <ViewerPdfContainer />
                        </MainLayout>
                      </MainAppGuard>
                    }
                  />
                  <Route
                    path="/virtual-employee-dashboard"
                    element={
                      <MainAppGuard>
                        <MainLayout>
                          <VirtualEmployeeDashboardContainer />
                        </MainLayout>
                      </MainAppGuard>
                    }
                  />
                  <Route
                    path="/company"
                    element={
                      <MainAppGuard>
                        <MainLayout>
                          <CompanyContainer />
                        </MainLayout>
                      </MainAppGuard>
                    }
                  />
                  <Route
                    path="/products"
                    element={
                      <MainAppGuard>
                        <MainLayout>
                          <ProductsContainer />
                        </MainLayout>
                      </MainAppGuard>
                    }
                  />
                  <Route
                    path="/agents"
                    element={
                      <MainAppGuard>
                        <MainLayout>
                          <AgentsContainer />
                        </MainLayout>
                      </MainAppGuard>
                    }
                  />
                  <Route
                    path="/skills"
                    element={
                      <MainAppGuard>
                        <MainLayout>
                          <SkillsContainer />
                        </MainLayout>
                      </MainAppGuard>
                    }
                  />
                  <Route
                    path="/protocols"
                    element={
                      <MainAppGuard>
                        <MainLayout>
                          <ProtocolsContainer />
                        </MainLayout>
                      </MainAppGuard>
                    }
                  />
                  <Route
                    path="/workflows"
                    element={
                      <MainAppGuard>
                        <MainLayout>
                          <WorkflowsContainer />
                        </MainLayout>
                      </MainAppGuard>
                    }
                  />
                  <Route
                    path="/kpis"
                    element={
                      <MainAppGuard>
                        <MainLayout>
                          <KpisContainer />
                        </MainLayout>
                      </MainAppGuard>
                    }
                  />
                  <Route
                    path="/data-inputs"
                    element={
                      <MainAppGuard>
                        <MainLayout>
                          <DataInputsContainer />
                        </MainLayout>
                      </MainAppGuard>
                    }
                  />
                </Route>{' '}
                {/* End LifecycleWrapper */}
              </Routes>
            </Suspense>
          </HashRouter>
        </BrandingProvider>
      </ThemeProvider>
    </LanguageProvider>
  </React.StrictMode>
)
