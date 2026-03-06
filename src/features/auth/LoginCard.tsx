import { SafetyCertificateOutlined } from '@ant-design/icons'
import { Button, Card, Typography, message } from 'antd'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'

export function LoginCard() {
  const login = useAuthStore((state) => state.login)
  const isLoading = useAuthStore((state) => state.isLoading)
  const navigate = useNavigate()

  const handleLogin = async () => {
    try {
      await login()
      message.success('Вход выполнен')
      navigate('/dashboard', { replace: true })
    } catch {
      message.error('Не удалось выполнить вход')
    }
  }

  return (
    <Card>
      <Typography.Title level={4} style={{ marginTop: 0 }}>
        Корпоративный вход
      </Typography.Title>
      <Typography.Paragraph type="secondary">
        Авторизуйтесь через Keycloak (realm: naliv-prod).
      </Typography.Paragraph>

      <Button
        className="touch-action"
        type="primary"
        icon={<SafetyCertificateOutlined />}
        loading={isLoading}
        block
        onClick={handleLogin}
      >
        Войти через Keycloak
      </Button>
    </Card>
  )
}
