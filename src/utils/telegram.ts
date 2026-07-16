export function getTelegramWebApp(): TelegramWebApp | null {
  try {
    return window.Telegram?.WebApp ?? null
  } catch {
    return null
  }
}

export function getTelegramInitData(): string {
  const webApp = getTelegramWebApp()

  if (!webApp?.initData) {
    throw new Error('Откройте приложение внутри Telegram')
  }

  try {
    webApp.ready?.()
  } catch (e) {
    console.warn('Telegram WebApp.ready() failed', e)
  }

  try {
    webApp.expand?.()
  } catch (e) {
    console.warn('Telegram WebApp.expand() failed', e)
  }

  return webApp.initData
}
