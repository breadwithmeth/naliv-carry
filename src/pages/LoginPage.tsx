import { Navigate } from 'react-router-dom'
import { LoginCard } from '../features/auth/LoginCard'
import { useAuthStore } from '../store/authStore'
import { extractUrlToken } from '../utils/urlToken'
import { useEffect } from 'react'

export function LoginPage() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const isInitialized = useAuthStore((state) => state.isInitialized)
  const loginByUrlToken = useAuthStore((state) => state.loginByUrlToken)

  useEffect(() => {
    if (!isAuthenticated && isInitialized && extractUrlToken()) {
      loginByUrlToken().catch(() => {
        // Error is handled in the store
      })
    }
  }, [isAuthenticated, isInitialized, loginByUrlToken])

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />
  }

  return (
    <main className="app-shell">
      <div className="page-container" style={{ minHeight: '100vh', justifyContent: 'center', paddingBottom: 18 }}>
        <LoginCard />
      </div>
    </main>
  )
}
