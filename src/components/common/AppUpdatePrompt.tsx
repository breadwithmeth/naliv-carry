import { Alert, Button } from 'antd'
import { useEffect, useState } from 'react'

export function AppUpdatePrompt() {
  const [hasUpdate, setHasUpdate] = useState(false)

  useEffect(() => {
    const handleUpdateReady = () => setHasUpdate(true)

    window.addEventListener('naliv-app-update-ready', handleUpdateReady)

    return () => {
      window.removeEventListener('naliv-app-update-ready', handleUpdateReady)
    }
  }, [])

  if (!hasUpdate) {
    return null
  }

  return (
    <Alert
      type="info"
      showIcon
      message="Доступно обновление"
      description="Обновите приложение, когда закончите текущее действие."
      action={
        <Button
          className="touch-action secondary-action"
          onClick={() => window.dispatchEvent(new CustomEvent('naliv-app-apply-update'))}
        >
          Обновить
        </Button>
      }
    />
  )
}
