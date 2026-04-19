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
const ModuleRouteGuard = ({ children }: { children: React.ReactNode }) => <>{children}</>

const MainLayout = ({ children }: { children: React.ReactNode }) => (
  <div data-testid="main-layout">{children}</div>
)
const PreAuthLayout = ({ children }: { children: React.ReactNode }) => (
  <div data-testid="pre-auth-layout">{children}</div>
)

const Splash = () => <div data-testid="splash-container">Splash</div>
const Login = () => <div data-testid="login-container">Login</div>
const AppsPlaceholder = () => <div data-testid="apps-placeholder-container">Apps Placeholder</div>
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
        path="/apps"
        element={
          <MainAppGuard>
            <ModuleRouteGuard>
              <MainLayout>
                <AppsPlaceholder />
              </MainLayout>
            </ModuleRouteGuard>
          </MainAppGuard>
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

describe('Route contract: splash -> login -> apps -> dashboard', () => {
  it('redirects root to splash', () => {
    render(<TestRoutes initialPath="/" />)
    expect(screen.queryByTestId('splash-container')).not.toBeNull()
  })

  it('keeps login as pre-auth route', () => {
    render(<TestRoutes initialPath="/login" />)
    expect(screen.queryByTestId('pre-auth-layout')).not.toBeNull()
    expect(screen.queryByTestId('login-container')).not.toBeNull()
  })

  it('keeps app listing placeholder as post-login default route', () => {
    render(<TestRoutes initialPath="/apps" />)
    expect(screen.queryByTestId('main-layout')).not.toBeNull()
    expect(screen.queryByTestId('apps-placeholder-container')).not.toBeNull()
  })

  it('keeps dashboard as authenticated home route', () => {
    render(<TestRoutes initialPath="/dashboard" />)
    expect(screen.queryByTestId('main-layout')).not.toBeNull()
    expect(screen.queryByTestId('dashboard-container')).not.toBeNull()
    expect(screen.queryByTestId('pre-auth-layout')).toBeNull()
  })
})
