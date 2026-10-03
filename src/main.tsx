import 'core-js/stable'
import 'regenerator-runtime/runtime'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import 'antd/dist/reset.css'
import './index.css'
import App from './App'
import { registerServiceWorker } from './pwa/registerServiceWorker'
import { logError, isIosQuotaNoise } from './utils/errorLog'

let quotaNoiseLogged = false

function handleGlobalError(error: unknown): void {
  if (isIosQuotaNoise(error)) {
    // Known iOS WebKit limitation in Telegram Mini Apps — log once, don't spam.
    if (!quotaNoiseLogged) {
      quotaNoiseLogged = true
      logError('window.onerror', 'iOS WebKit quota error (известное ограничение Telegram iOS): ' + String(error))
    }
    return
  }
  logError('window.onerror', error)
}

window.addEventListener('error', (event) => {
  handleGlobalError(event.error ?? event.message)
})

window.addEventListener('unhandledrejection', (event) => {
  if (isIosQuotaNoise(event.reason)) {
    // Known iOS WebKit limitation in Telegram Mini Apps — log once, don't spam.
    if (!quotaNoiseLogged) {
      quotaNoiseLogged = true
      logError('unhandledrejection', 'iOS WebKit quota error (известное ограничение Telegram iOS): ' + String(event.reason))
    }
    event.preventDefault()
    return
  }
  logError('unhandledrejection', event.reason)
})

// On preload failure, try to refresh stale service-worker caches first, then
// reload — but never reload in a tight loop (a missing chunk would otherwise
// cause an infinite reload cycle inside the Telegram WebView).
const PRELOAD_RELOAD_KEY = 'preload_error_reload_at'
const PRELOAD_RELOAD_COOLDOWN_MS = 10_000

window.addEventListener('vite:preloadError', (event) => {
  event.preventDefault()

  const now = Date.now()
  let lastReloadAt = 0
  try {
    lastReloadAt = Number(window.sessionStorage.getItem(PRELOAD_RELOAD_KEY)) || 0
  } catch {
    // sessionStorage may be unavailable — treat as no previous reload.
  }

  if (now - lastReloadAt < PRELOAD_RELOAD_COOLDOWN_MS) {
    console.error('Chunk failed to load again after a recent reload — skipping further reloads')
    return
  }

  try {
    window.sessionStorage.setItem(PRELOAD_RELOAD_KEY, String(now))
  } catch {
    // ignore
  }

  void (async () => {
    try {
      if ('caches' in window) {
        const keys = await window.caches.keys()
        await Promise.all(keys.map((key) => window.caches.delete(key)))
      }
    } catch {
      // ignore cache cleanup failures
    }
    window.location.reload()
  })()
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

registerServiceWorker()
