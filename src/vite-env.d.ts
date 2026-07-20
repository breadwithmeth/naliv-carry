/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

interface TelegramWebApp {
  initData?: string
  isExpanded?: boolean
  viewportHeight?: number
  viewportStableHeight?: number
  ready: () => void
  expand: () => void
  disableVerticalSwipes?: () => void
  isVersionAtLeast?: (version: string) => boolean
  onEvent?: (eventType: 'viewportChanged', callback: () => void) => void
  offEvent?: (eventType: 'viewportChanged', callback: () => void) => void
  setHeaderColor?: (color: string) => void
  setBackgroundColor?: (color: string) => void
  openLink?: (url: string) => void
}

interface Window {
  Telegram?: {
    WebApp?: TelegramWebApp
  }
}
