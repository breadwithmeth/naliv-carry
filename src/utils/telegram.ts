export function getTelegramWebApp(): TelegramWebApp | null {
  try {
    return window.Telegram?.WebApp ?? null
  } catch {
    return null
  }
}

/**
 * Wait for the telegram-web-app.js script to become available. In some Telegram
 * WebView sessions the script request to telegram.org is slow, and a strictly
 * synchronous check right after boot would wrongly report "not opened in Telegram".
 */
export async function waitForTelegramWebApp(timeoutMs = 3000): Promise<TelegramWebApp | null> {
  const immediate = getTelegramWebApp()
  if (immediate) return immediate

  const startedAt = Date.now()
  while (Date.now() - startedAt < timeoutMs) {
    await new Promise((resolve) => setTimeout(resolve, 100))
    const webApp = getTelegramWebApp()
    if (webApp) return webApp
  }

  return null
}

export async function getTelegramInitData(): Promise<string> {
  const webApp = (await waitForTelegramWebApp()) ?? getTelegramWebApp()

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
