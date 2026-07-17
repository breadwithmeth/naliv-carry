import { Navigate, useSearchParams } from 'react-router-dom'
import { LoginCard } from '../features/auth/LoginCard'
import { useAuthStore } from '../store/authStore'
import { useEffect } from 'react'

export function LoginPage() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const isInitialized = useAuthStore((state) => state.isInitialized)
  const loginByToken = useAuthStore((state) => state.loginByToken)
  const [searchParams] = useSearchParams()

  useEffect(() => {
    const token = searchParams.get('token')
    if (token && !isAuthenticated && isInitialized) {
      loginByToken(token)
    }
  }, [searchParams, isAuthenticated, isInitialized, loginByToken])

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
