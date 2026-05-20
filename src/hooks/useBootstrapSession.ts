import { useEffect } from 'react'
import { useAuthStore } from '../store/authStore'
import { useCourierStore } from '../store/courierStore'
import { useOrdersStore } from '../store/ordersStore'

const TOKEN_REFRESH_INTERVAL_MS = 60_000

export function useBootstrapSession(): void {
  const initialize = useAuthStore((state) => state.initialize)
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const isInitialized = useAuthStore((state) => state.isInitialized)
  const refreshToken = useAuthStore((state) => state.refreshToken)
  const fetchOrders = useOrdersStore((state) => state.fetchOrders)
  const loadProfile = useCourierStore((state) => state.loadProfile)

  useEffect(() => {
    initialize().catch(() => {
      // Session bootstrap errors are handled by auth guards and login page.
    })
  }, [initialize])

  useEffect(() => {
    if (!isInitialized || !isAuthenticated) {
      return
    }

    Promise.allSettled([fetchOrders(), loadProfile()])
  }, [fetchOrders, isAuthenticated, isInitialized, loadProfile])

  useEffect(() => {
    if (!isInitialized || !isAuthenticated) {
      return
    }

    const refresh = () => {
      refreshToken().catch(() => {
        // Auth guards and the next API call will handle an expired session.
      })
    }

    refresh()
    const intervalId = window.setInterval(refresh, TOKEN_REFRESH_INTERVAL_MS)
    window.addEventListener('focus', refresh)

    return () => {
      window.clearInterval(intervalId)
      window.removeEventListener('focus', refresh)
    }
  }, [isAuthenticated, isInitialized, refreshToken])
}
