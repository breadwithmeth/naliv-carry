import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import type { ReactNode } from 'react'
import { Flex, Spin } from 'antd'

interface Props {
  children?: ReactNode
}

export function ProtectedRoute({ children }: Props) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const isInitialized = useAuthStore((state) => state.isInitialized)
  const isLoading = useAuthStore((state) => state.isLoading)

  if (!isInitialized || isLoading) {
    return (
      <Flex justify="center" align="center" style={{ minHeight: '100vh' }}>
        <Spin size="large" />
      </Flex>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (children) {
    return <>{children}</>
  }

  return <Outlet />
}
