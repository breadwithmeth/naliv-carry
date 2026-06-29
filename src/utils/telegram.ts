export function getTelegramWebApp(): TelegramWebApp | null {
  return window.Telegram?.WebApp ?? null
}

export function getTelegramInitData(): string {
  const webApp = getTelegramWebApp()

  if (!webApp?.initData) {
    throw new Error('Откройте приложение внутри Telegram')
  }

  webApp.ready()
  webApp.expand()

  return webApp.initData
}
