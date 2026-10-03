import { Suspense, lazy } from 'react'
import { Navigate, Route, BrowserRouter, HashRouter, Routes, useLocation } from 'react-router-dom'
import { Spin } from 'antd'
import { CourierLayout } from '../components/layout/CourierLayout'
import { useBootstrapSession } from '../hooks/useBootstrapSession'
import { useOnlineStatus } from '../hooks/useOnlineStatus'
import { useSyncQueue } from '../hooks/useSyncQueue'
import { useTelegramBackButton } from '../hooks/useTelegramMiniApp'
import { ProtectedRoute } from './ProtectedRoute'

const CallHandlerPage = lazy(() => import('../pages/CallHandlerPage').then((m) => ({ default: m.CallHandlerPage })))
const DashboardPage = lazy(() => import('../pages/DashboardPage').then((m) => ({ default: m.DashboardPage })))
const LoginPage = lazy(() => import('../pages/LoginPage').then((m) => ({ default: m.LoginPage })))
const MapPage = lazy(() => import('../pages/MapPage').then((m) => ({ default: m.MapPage })))
const OrderDetailsPage = lazy(() => import('../pages/OrderDetailsPage').then((m) => ({ default: m.OrderDetailsPage })))
const OrdersPage = lazy(() => import('../pages/OrdersPage').then((m) => ({ default: m.OrdersPage })))
const ProfilePage = lazy(() => import('../pages/ProfilePage').then((m) => ({ default: m.ProfilePage })))
const ShiftPaymentStatsPage = lazy(() =>
  import('../pages/ShiftPaymentStatsPage').then((m) => ({ default: m.ShiftPaymentStatsPage })),
)
const ShiftsPage = lazy(() => import('../pages/ShiftsPage').then((m) => ({ default: m.ShiftsPage })))

function RouteFallback() {
  return (
    <div style={{ minHeight: '50vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Spin size="large" />
    </div>
  )
}

function TelegramBackButtonSync() {
  const { pathname } = useLocation()
  useTelegramBackButton(pathname)
  return null
}

export function AppRouter() {
  useBootstrapSession()
  useOnlineStatus()
  useSyncQueue()

  const Router = String(import.meta.env.VITE_ROUTER_MODE ?? 'browser') === 'hash' ? HashRouter : BrowserRouter

  return (
    <Router>
      <TelegramBackButtonSync />
      <Suspense fallback={<RouteFallback />}>
        <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/call/:phoneNumber" element={<CallHandlerPage />} />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <CourierLayout>
                <DashboardPage />
              </CourierLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/orders"
          element={
            <ProtectedRoute>
              <CourierLayout>
                <OrdersPage />
              </CourierLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/orders/:orderId"
          element={
            <ProtectedRoute>
              <CourierLayout>
                <OrderDetailsPage />
              </CourierLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/map"
          element={
            <ProtectedRoute>
              <CourierLayout>
                <MapPage />
              </CourierLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/shifts"
          element={
            <ProtectedRoute>
              <CourierLayout>
                <ShiftsPage />
              </CourierLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/shifts/payment-report"
          element={
            <ProtectedRoute>
              <CourierLayout>
                <ShiftPaymentStatsPage />
              </CourierLayout>
            </ProtectedRoute>
          }
        />
        <Route path="/shifts/payment-stats" element={<Navigate to="/shifts/payment-report" replace />} />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <CourierLayout>
                <ProfilePage />
              </CourierLayout>
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Suspense>
    </Router>
  )
}
