import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import { RequireAuth } from './auth/RequireAuth'
import LoginPage from './pages/auth/LoginPage'

/**
 * HashRouter is used so GitHub Pages serves the SPA without server-side
 * rewrites — refreshing any deep link (#/vendor/booking/…) never 404s.
 *
 * The authenticated route tree is expanded to mirror the original console
 * after the site audit; for now it renders a placeholder behind the guard.
 */
export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/vendor/*"
          element={
            <RequireAuth>
              <Placeholder />
            </RequireAuth>
          }
        />
        <Route path="/" element={<Navigate to="/vendor/booking" replace />} />
        <Route path="*" element={<Navigate to="/vendor/booking" replace />} />
      </Routes>
    </HashRouter>
  )
}

function Placeholder() {
  return (
    <div className="p-6 text-md text-ink">
      Authenticated area — the console shell and pages are built after the site audit.
    </div>
  )
}
