import { Button, Space, message } from 'antd'
import { CopyOutlined, LogoutOutlined, UserOutlined } from '@ant-design/icons'
import { useEffect, type ReactNode } from 'react'
import { useSnackbar } from '../hooks/useSnackbar'
import { useAuthStore } from '../store/authStore'
import { useCourierStore } from '../store/courierStore'
import { useSessionStore } from '../store/sessionStore'

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

  const workforceId =
    profile?.workforce_employee_id ??
    (profile?.employee_id ? String(profile.employee_id) : undefined) ??
    (profile?.courier_id ? String(profile.courier_id) : undefined) ??
    profile?.telegram_user_id ??
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
    <div className="screen">
      <section className="screen-hero screen-hero--compact">
        <span className="eyebrow">Профиль</span>
        <h1 className="screen-title screen-title--sm">{profile?.name ?? user?.name ?? 'Курьер'}</h1>
        <p className="screen-copy">{profile?.login ?? user?.phoneOrEmail ?? 'Данные загружаются'}</p>
      </section>

      <section className="panel">
        <div className="panel__body">
          <Space align="center" size={12}>
            <UserOutlined style={{ fontSize: 28, color: 'var(--app-accent)' }} />
            <div>
              <h2 className="panel__title">Рабочие данные</h2>
              <p className="panel__text">Покажите ID диспетчеру, если он нужен для проверки.</p>
            </div>
          </Space>

          <ProfileField label="ID курьера" value={workforceId}>
            <Button
              className="touch-action profile-field__action secondary-action"
              icon={<CopyOutlined />}
              onClick={() => void handleCopyWorkforceId()}
              disabled={workforceId === '-'}
            >
              Копировать
            </Button>
          </ProfileField>
          <ProfileField label="Доступ" value={profile?.access_level ?? '-'} />
          <ProfileField label="Telegram" value={profile?.telegram_username ? `@${profile.telegram_username}` : '-'} />
          <ProfileField label="Устройство" value={deviceInfo} />
        </div>
      </section>

      <Button
        className="touch-action danger-action"
        icon={<LogoutOutlined />}
        block
        onClick={async () => {
          await logout()
        }}
      >
        Выйти
      </Button>
    </div>
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
        <span className="profile-field__label">{label}</span>
        <span className="profile-field__value">{value}</span>
      </div>
      {children}
    </div>
  )
}
