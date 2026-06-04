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
      message="Нет интернета"
      description="Проверьте подключение. Сохраненные доставки останутся доступными, а изменения отправятся, когда связь вернется."
    />
  )
}
