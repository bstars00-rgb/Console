import { lazy, Suspense } from 'react'
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import { RequireAuth } from './auth/RequireAuth'
import { AppShell } from './components/shell/AppShell'
import { ToastProvider } from './components/ui/Toast'
import { Loading } from './components/ui/feedback'
import LoginPage from './pages/auth/LoginPage'

const BookingsPage = lazy(() => import('./pages/vendor/BookingsPage'))
const RoomTypesPage = lazy(() => import('./pages/vendor/RoomTypesPage'))
const RatePlansPage = lazy(() => import('./pages/vendor/RatePlansPage'))
const RateAllotmentPage = lazy(() => import('./pages/vendor/RateAllotmentPage'))
const PromotionPage = lazy(() => import('./pages/vendor/PromotionPage'))
const BillingsPage = lazy(() => import('./pages/vendor/BillingsPage'))
const DashboardPage = lazy(() => import('./pages/vendor/DashboardPage'))
const FaqPage = lazy(() => import('./pages/vendor/FaqPage'))
const NoticePage = lazy(() => import('./pages/vendor/NoticePage'))
const HotelContentPage = lazy(() => import('./pages/vendor/HotelContentPage'))

/**
 * HashRouter so GitHub Pages serves the SPA without server rewrites — refreshing
 * any deep link (#/vendor/booking/…) never 404s.
 */
export default function App() {
  return (
    <ToastProvider>
      <HashRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            element={
              <RequireAuth>
                <AppShell />
              </RequireAuth>
            }
          >
            <Route
              path="/vendor/*"
              element={
                <Suspense fallback={<Loading />}>
                  <VendorRoutes />
                </Suspense>
              }
            />
          </Route>
          <Route path="/" element={<Navigate to="/vendor/booking" replace />} />
          <Route path="*" element={<Navigate to="/vendor/booking" replace />} />
        </Routes>
      </HashRouter>
    </ToastProvider>
  )
}

function VendorRoutes() {
  return (
    <Routes>
      <Route path="room-types" element={<RoomTypesPage />} />
      <Route path="rate-plans" element={<RatePlansPage />} />
      <Route path="rate-allotment" element={<RateAllotmentPage />} />
      <Route path="promotion" element={<PromotionPage />} />
      <Route path="booking" element={<BookingsPage />} />
      <Route path="billing" element={<BillingsPage />} />
      <Route path="dashboard" element={<DashboardPage />} />
      <Route path="faq" element={<FaqPage />} />
      <Route path="notice" element={<NoticePage />} />
      <Route path="hotel-content" element={<HotelContentPage />} />
      <Route path="hotel-content/:code" element={<HotelContentPage />} />
      <Route path="*" element={<Navigate to="booking" replace />} />
    </Routes>
  )
}
