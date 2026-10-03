import { useEffect } from 'react'
import { getTelegramWebApp } from '../utils/telegram'

const TELEGRAM_APP_BACKGROUND = '#0A0A0A'

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
      webApp.ready?.()
      webApp.expand?.()
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

const NESTED_ROUTE_PATTERNS = [/^\/orders\/[^/]+$/, /^\/map$/, /^\/profile$/, /^\/shifts\/payment-report$/]

/** Show Telegram's in-app back button on nested routes; otherwise the swipe
 * gesture / hardware back closes the whole Mini App and it looks like a crash. */
export function useTelegramBackButton(pathname: string): void {
  useEffect(() => {
    const webApp = getTelegramWebApp()
    const backButton = webApp?.BackButton

    if (!backButton?.show || !backButton?.hide || !backButton?.onClick || !backButton?.offClick) {
      return
    }

    const isNestedRoute = NESTED_ROUTE_PATTERNS.some((pattern) => pattern.test(pathname))

    if (!isNestedRoute) {
      try {
        backButton.hide()
      } catch {
        // ignore
      }
      return
    }

    const handleBack = () => {
      window.history.back()
    }

    try {
      backButton.onClick(handleBack)
      backButton.show()
    } catch (error) {
      console.warn('Telegram BackButton show failed', error)
    }

    return () => {
      try {
        backButton.offClick?.(handleBack)
        backButton.hide?.()
      } catch {
        // ignore
      }
    }
  }, [pathname])
}
