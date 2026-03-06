import { Col, Row } from 'antd'
import { Navigate } from 'react-router-dom'
import { LoginCard } from '../features/auth/LoginCard'
import { useAuthStore } from '../store/authStore'

export function LoginPage() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />
  }

  return (
    <Row align="middle" justify="center" style={{ minHeight: '100vh', padding: 12 }}>
      <Col xs={24} sm={16} md={12} lg={8}>
        <LoginCard />
      </Col>
    </Row>
  )
}
