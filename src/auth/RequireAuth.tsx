import { Navigate, useLocation } from 'react-router-dom'
import { isAuthenticated } from './session'

/** Route guard: redirect unauthenticated users to /login, preserving intent. */
export function RequireAuth({ children }: { children: React.ReactNode }) {
  const location = useLocation()
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }
  return <>{children}</>
}
