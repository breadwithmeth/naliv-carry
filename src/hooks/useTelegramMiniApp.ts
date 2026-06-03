import { useEffect } from 'react'

const TELEGRAM_APP_BACKGROUND = '#0A0A0A'

function getTelegramWebApp(): TelegramWebApp | null {
  return window.Telegram?.WebApp ?? null
}

function applyTelegramViewport(webApp: TelegramWebApp): void {
  if (typeof webApp.viewportHeight === 'number' && webApp.viewportHeight > 0) {
    document.documentElement.style.setProperty('--tg-viewport-height', `${webApp.viewportHeight}px`)
  }

  if (typeof webApp.viewportStableHeight === 'number' && webApp.viewportStableHeight > 0) {
    document.documentElement.style.setProperty('--tg-viewport-stable-height', `${webApp.viewportStableHeight}px`)
  }
}

export function useTelegramMiniApp(): void {
  useEffect(() => {
    const webApp = getTelegramWebApp()

    if (!webApp) {
      return
    }

    document.documentElement.dataset.telegramMiniApp = 'true'

    const handleViewportChanged = () => {
      applyTelegramViewport(webApp)
    }

    try {
      webApp.ready()
      webApp.expand()
      webApp.setHeaderColor?.(TELEGRAM_APP_BACKGROUND)
      webApp.setBackgroundColor?.(TELEGRAM_APP_BACKGROUND)
      applyTelegramViewport(webApp)

      if (!webApp.isVersionAtLeast || webApp.isVersionAtLeast('7.7')) {
        webApp.disableVerticalSwipes?.()
      }

      webApp.onEvent?.('viewportChanged', handleViewportChanged)
    } catch (error) {
      console.warn('Telegram Mini App initialization failed', error)
    }

    return () => {
      delete document.documentElement.dataset.telegramMiniApp

      try {
        webApp.offEvent?.('viewportChanged', handleViewportChanged)
      } catch {
        // Telegram clients may remove the bridge while the WebView is closing.
      }
    }
  }, [])
}
