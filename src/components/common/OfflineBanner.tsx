import { Alert } from 'antd'
import { useSessionStore } from '../../store/sessionStore'

export function OfflineBanner() {
  const isOnline = useSessionStore((state) => state.isOnline)

  if (isOnline) {
    return null
  }

  return (
    <Alert
      type="warning"
      showIcon
      message="Офлайн-режим"
      description="Показываются кэшированные доставки. Обновления статусов синхронизируются автоматически."
    />
  )
}
