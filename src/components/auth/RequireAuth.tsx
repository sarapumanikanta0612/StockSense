import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'

function AuthLoadingState() {
  return (
    <main className="auth-status" aria-live="polite" aria-busy="true">
      <span className="auth-status__spinner" aria-hidden="true" />
      <p>Restoring your StockSense session…</p>
    </main>
  )
}

export function RequireAuth() {
  const { isAuthenticated, isLoading } = useAuth()
  const location = useLocation()

  if (isLoading) return <AuthLoadingState />
  if (!isAuthenticated) return <Navigate replace to="/login" state={{ from: location }} />

  return <Outlet />
}

export function RedirectAuthenticated() {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) return <AuthLoadingState />
  if (isAuthenticated) return <Navigate replace to="/dashboard" />

  return <Outlet />
}
