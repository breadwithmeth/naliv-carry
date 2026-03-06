import { useEffect } from 'react'
import { updateOrderStatus } from '../api/ordersApi'
import { useSessionStore } from '../store/sessionStore'
import { clearQueue, getQueue } from '../utils/offlineQueue'

export function useSyncQueue(): void {
  const isOnline = useSessionStore((state) => state.isOnline)
  const setLastSyncAt = useSessionStore((state) => state.setLastSyncAt)

  useEffect(() => {
    if (!isOnline) {
      return
    }

    const queue = getQueue()
    if (!queue.length) {
      return
    }

    const sync = async () => {
      for (const item of queue) {
        await updateOrderStatus(item.orderId, item.status)
      }

      clearQueue()
      setLastSyncAt(new Date().toISOString())
    }

    sync().catch(() => {
      // Keep queue for the next retry cycle.
    })
  }, [isOnline, setLastSyncAt])
}
