import { Button, Card, Descriptions, Form, Input, Space, Typography, message } from 'antd'
import { CopyOutlined } from '@ant-design/icons'
import { useEffect } from 'react'
import { changeCourierPassword } from '../api/courierApi'
import { useAuthStore } from '../store/authStore'
import { useCourierStore } from '../store/courierStore'
import { useSessionStore } from '../store/sessionStore'

interface ChangePasswordValues {
  currentPassword: string
  newPassword: string
}

export function ProfilePage() {
  const user = useAuthStore((state) => state.user)
  const logout = useAuthStore((state) => state.logout)
  const profile = useCourierStore((state) => state.profile)
  const loadProfile = useCourierStore((state) => state.loadProfile)

  const deviceInfo = useSessionStore((state) => state.deviceInfo)
  const hydrateDeviceInfo = useSessionStore((state) => state.hydrateDeviceInfo)

  useEffect(() => {
    hydrateDeviceInfo()
    loadProfile().catch(() => {
      // Profile will still fallback to auth token info.
    })
  }, [hydrateDeviceInfo, loadProfile])

  const handleChangePassword = async (values: ChangePasswordValues) => {
    try {
      await changeCourierPassword(values)
      message.success('Пароль изменен')
    } catch {
      message.error('Не удалось изменить пароль')
    }
  }

  const workforceId =
    profile?.workforce_employee_id ??
    profile?.keycloak_id ??
    (profile?.employee_id ? String(profile.employee_id) : undefined) ??
    (profile?.courier_id ? String(profile.courier_id) : undefined) ??
    '-'

  const handleCopyWorkforceId = async (): Promise<void> => {
    if (workforceId === '-') {
      return
    }

    try {
      await navigator.clipboard.writeText(workforceId)
      message.success('ID скопирован')
    } catch {
      message.error('Не удалось скопировать ID')
    }
  }

  return (
    <Space direction="vertical" style={{ width: '100%' }}>
      <Typography.Title level={4} style={{ margin: 0 }}>
        Профиль курьера
      </Typography.Title>
      <Card>
        <Descriptions column={1} size="small">
          <Descriptions.Item label="Workforce ID">
            <Space size="small">
              <Typography.Text>{workforceId}</Typography.Text>
              <Button
                className="touch-action"
                size="small"
                icon={<CopyOutlined />}
                onClick={() => void handleCopyWorkforceId()}
                disabled={workforceId === '-'}
              >
                Копировать
              </Button>
            </Space>
          </Descriptions.Item>
          <Descriptions.Item label="Имя">{profile?.name ?? user?.name ?? '-'}</Descriptions.Item>
          <Descriptions.Item label="Логин">{profile?.login ?? user?.phoneOrEmail ?? '-'}</Descriptions.Item>
          <Descriptions.Item label="Уровень доступа">{profile?.access_level ?? '-'}</Descriptions.Item>
          <Descriptions.Item label="Устройство">{deviceInfo}</Descriptions.Item>
        </Descriptions>
      </Card>
      <Card title="Смена пароля">
        <Form layout="vertical" onFinish={handleChangePassword} requiredMark={false}>
          <Form.Item
            name="currentPassword"
            label="Текущий пароль"
            rules={[{ required: true, message: 'Введите текущий пароль' }]}
          >
            <Input.Password className="touch-action" />
          </Form.Item>
          <Form.Item
            name="newPassword"
            label="Новый пароль"
            rules={[
              { required: true, message: 'Введите новый пароль' },
              { min: 6, message: 'Минимум 6 символов' },
              {
                pattern: /^(?=.*[A-Za-z])(?=.*\d).+$/,
                message: 'Пароль должен содержать буквы и цифры',
              },
            ]}
          >
            <Input.Password className="touch-action" />
          </Form.Item>

          <Button type="primary" htmlType="submit" className="touch-action">
            Изменить пароль
          </Button>
        </Form>
      </Card>
      <Button
        danger
        className="touch-action"
        onClick={async () => {
          await logout()
        }}
      >
        Выйти
      </Button>
    </Space>
  )
}
