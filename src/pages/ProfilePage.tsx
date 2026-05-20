import { Button, Card, Form, Input, Space, Typography, message } from 'antd'
import { CopyOutlined, LogoutOutlined, UserOutlined } from '@ant-design/icons'
import { useEffect, type ReactNode } from 'react'
import { changeCourierPassword } from '../api/courierApi'
import { useSnackbar } from '../hooks/useSnackbar'
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
  const { showError } = useSnackbar()

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
      showError('Не удалось изменить пароль')
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
      showError('Не удалось скопировать ID')
    }
  }

  return (
    <Space direction="vertical" style={{ width: '100%' }}>
      <Typography.Title level={4} style={{ margin: 0 }}>
        Профиль курьера
      </Typography.Title>
      <Card>
        <Space direction="vertical" size={12} style={{ width: '100%' }}>
          <Space align="center" size={12}>
            <UserOutlined style={{ fontSize: 28 }} />
            <Space direction="vertical" size={0}>
              <Typography.Text strong>{profile?.name ?? user?.name ?? '-'}</Typography.Text>
              <Typography.Text type="secondary">{profile?.login ?? user?.phoneOrEmail ?? '-'}</Typography.Text>
            </Space>
          </Space>

          <ProfileField label="Workforce ID" value={workforceId}>
            <Button
              className="touch-action profile-field__action"
              icon={<CopyOutlined />}
              onClick={() => void handleCopyWorkforceId()}
              disabled={workforceId === '-'}
            >
              Копировать
            </Button>
          </ProfileField>
          <ProfileField label="Уровень доступа" value={profile?.access_level ?? '-'} />
          <ProfileField label="Устройство" value={deviceInfo} />
        </Space>
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

          <Button type="primary" htmlType="submit" className="touch-action" block>
            Изменить пароль
          </Button>
        </Form>
      </Card>
      <Button
        danger
        className="touch-action"
        icon={<LogoutOutlined />}
        block
        onClick={async () => {
          await logout()
        }}
      >
        Выйти
      </Button>
    </Space>
  )
}

interface ProfileFieldProps {
  label: string
  value: string
  children?: ReactNode
}

function ProfileField({ label, value, children }: ProfileFieldProps) {
  return (
    <div className="profile-field">
      <div className="profile-field__content">
        <Typography.Text type="secondary">{label}</Typography.Text>
        <Typography.Text strong copyable={false}>
          {value}
        </Typography.Text>
      </div>
      {children}
    </div>
  )
}
