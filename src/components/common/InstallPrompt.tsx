import { DownloadOutlined } from '@ant-design/icons'
import { Alert, Button } from 'antd'
import { useEffect, useState } from 'react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>
}

function isStandalone(): boolean {
  const navigatorWithStandalone = window.navigator as Navigator & { standalone?: boolean }
  return window.matchMedia('(display-mode: standalone)').matches || navigatorWithStandalone.standalone === true
}

export function InstallPrompt() {
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null)
  const [isInstalled, setIsInstalled] = useState(() => isStandalone())

  useEffect(() => {
    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault()
      setInstallEvent(event as BeforeInstallPromptEvent)
    }

    const handleInstalled = () => {
      setIsInstalled(true)
      setInstallEvent(null)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleInstalled)
    }
  }, [])

  if (isInstalled || !installEvent) {
    return null
  }

  const handleInstall = async () => {
    await installEvent.prompt()
    const choice = await installEvent.userChoice

    if (choice.outcome === 'accepted') {
      setIsInstalled(true)
    }

    setInstallEvent(null)
  }

  return (
    <Alert
      type="info"
      showIcon
      message="Установить приложение"
      description="Добавьте Naliv Carry на главный экран для быстрого запуска и стабильной работы."
      action={
        <Button className="touch-action" type="primary" icon={<DownloadOutlined />} onClick={() => void handleInstall()}>
          Установить
        </Button>
      }
    />
  )
}
