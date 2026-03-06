import { useEffect } from 'react'
import { useSessionStore } from '../store/sessionStore'

export function useOnlineStatus(): void {
  const setOnline = useSessionStore((state) => state.setOnline)

  useEffect(() => {
    const handleOnline = () => setOnline(true)
    const handleOffline = () => setOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [setOnline])
}
