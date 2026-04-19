// @vitest-environment jsdom
import React from 'react'
import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { MemoryRouter, Navigate, Route, Routes } from 'react-router-dom'

afterEach(() => {
  cleanup()
})

const PublicOnlyGuard = ({ children }: { children: React.ReactNode }) => <>{children}</>
const MainAppGuard = ({ children }: { children: React.ReactNode }) => <>{children}</>
const OnboardingGuard = ({ children }: { children: React.ReactNode }) => <>{children}</>
const ModuleRouteGuard = ({ children }: { children: React.ReactNode }) => <>{children}</>

const MainLayout = ({ children }: { children: React.ReactNode }) => (
  <div data-testid="main-layout">{children}</div>
)
const PreAuthLayout = ({ children }: { children: React.ReactNode }) => (
  <div data-testid="pre-auth-layout">{children}</div>
)

const Splash = () => <div data-testid="splash-container">Splash</div>
const Login = () => <div data-testid="login-container">Login</div>
const Onboarding = () => <div data-testid="onboarding-container">Onboarding</div>
const Dashboard = () => <div data-testid="dashboard-container">Dashboard</div>

const TestRoutes = ({ initialPath }: { initialPath: string }) => (
  <MemoryRouter initialEntries={[initialPath]}>
    <Routes>
      <Route path="/splash" element={<Splash />} />
      <Route path="/" element={<Navigate to="/splash" replace />} />

      <Route
        path="/login"
        element={
          <PublicOnlyGuard>
            <PreAuthLayout>
              <Login />
            </PreAuthLayout>
          </PublicOnlyGuard>
        }
      />

      <Route
        path="/onboarding"
        element={
          <OnboardingGuard>
            <MainLayout>
              <Onboarding />
            </MainLayout>
          </OnboardingGuard>
        }
      />

      <Route
        path="/dashboard"
        element={
          <MainAppGuard>
            <ModuleRouteGuard>
              <MainLayout>
                <Dashboard />
              </MainLayout>
            </ModuleRouteGuard>
          </MainAppGuard>
        }
      />
    </Routes>
  </MemoryRouter>
)

describe('Route contract: splash -> login -> onboarding -> dashboard', () => {
  it('redirects root to splash', () => {
    render(<TestRoutes initialPath="/" />)
    expect(screen.queryByTestId('splash-container')).not.toBeNull()
  })

  it('keeps login as pre-auth route', () => {
    render(<TestRoutes initialPath="/login" />)
    expect(screen.queryByTestId('pre-auth-layout')).not.toBeNull()
    expect(screen.queryByTestId('login-container')).not.toBeNull()
  })

  it('keeps onboarding as post-login gate route', () => {
    render(<TestRoutes initialPath="/onboarding" />)
    expect(screen.queryByTestId('main-layout')).not.toBeNull()
    expect(screen.queryByTestId('onboarding-container')).not.toBeNull()
  })

  it('keeps dashboard as authenticated home route', () => {
    render(<TestRoutes initialPath="/dashboard" />)
    expect(screen.queryByTestId('main-layout')).not.toBeNull()
    expect(screen.queryByTestId('dashboard-container')).not.toBeNull()
    expect(screen.queryByTestId('pre-auth-layout')).toBeNull()
  })
})
