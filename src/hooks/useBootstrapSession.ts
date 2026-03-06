import { useEffect } from 'react'
import { useAuthStore } from '../store/authStore'
import { useCourierStore } from '../store/courierStore'
import { useOrdersStore } from '../store/ordersStore'

export function useBootstrapSession(): void {
  const initialize = useAuthStore((state) => state.initialize)
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const isInitialized = useAuthStore((state) => state.isInitialized)
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
}
