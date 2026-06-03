import { Navigate } from 'react-router-dom'
import { LoginCard } from '../features/auth/LoginCard'
import { useAuthStore } from '../store/authStore'

export function LoginPage() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)

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
