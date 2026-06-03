import { SafetyCertificateOutlined } from '@ant-design/icons'
import { Button, message } from 'antd'
import { useNavigate } from 'react-router-dom'
import { getApiErrorMessage } from '../../api/errors'
import { useAuthStore } from '../../store/authStore'
import { useSnackbar } from '../../hooks/useSnackbar'

export function LoginCard() {
  const login = useAuthStore((state) => state.login)
  const isLoading = useAuthStore((state) => state.isLoading)
  const navigate = useNavigate()
  const { showError } = useSnackbar()

  const handleLogin = async () => {
    try {
      await login()
      message.success('Вход выполнен')
      navigate('/dashboard', { replace: true })
    } catch (error) {
      showError(getApiErrorMessage(error, 'Попробуйте войти еще раз.'), {
        title: 'Не удалось выполнить вход',
      })
    }
  }

  return (
    <section className="screen">
      <div className="screen-hero">
        <span className="eyebrow">Naliv Carry</span>
        <h1 className="screen-title">Войдите и начните смену</h1>
        <p className="screen-copy">Один вход открывает доставки, смену, оплату и маршрут.</p>
      </div>
      <Button
        className="touch-action"
        type="primary"
        icon={<SafetyCertificateOutlined />}
        loading={isLoading}
        block
        onClick={handleLogin}
      >
        Войти
      </Button>
    </section>
  )
}
