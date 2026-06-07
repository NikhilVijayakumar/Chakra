import { type FC, type ReactNode } from 'react'
import { Navigate } from 'react-router-dom'

const isAuthenticated = (): boolean =>
  Boolean(localStorage.getItem('chakra_employee_email'))

export const MainAppGuard: FC<{ children: ReactNode }> = ({ children }) => {
  if (!isAuthenticated()) return <Navigate to="/login" replace />
  return <>{children}</>
}

export const PublicOnlyGuard: FC<{ children: ReactNode }> = ({ children }) => {
  if (isAuthenticated()) return <Navigate to="/home" replace />
  return <>{children}</>
}
