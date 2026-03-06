import { Navigate, Route, BrowserRouter, Routes } from 'react-router-dom'
import { CourierLayout } from '../components/layout/CourierLayout'
import { useBootstrapSession } from '../hooks/useBootstrapSession'
import { useOnlineStatus } from '../hooks/useOnlineStatus'
import { useSyncQueue } from '../hooks/useSyncQueue'
import { DashboardPage } from '../pages/DashboardPage'
import { LoginPage } from '../pages/LoginPage'
import { MapPage } from '../pages/MapPage'
import { OrderDetailsPage } from '../pages/OrderDetailsPage'
import { OrdersPage } from '../pages/OrdersPage'
import { ProfilePage } from '../pages/ProfilePage'
import { ProtectedRoute } from './ProtectedRoute'

export function AppRouter() {
  useBootstrapSession()
  useOnlineStatus()
  useSyncQueue()

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />

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
    </BrowserRouter>
  )
}
