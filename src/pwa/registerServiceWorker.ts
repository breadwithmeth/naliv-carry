import { registerSW } from 'virtual:pwa-register'

export function registerServiceWorker(): void {
  if (!('serviceWorker' in navigator)) {
    return
  }

  if (import.meta.env.DEV) {
    void unregisterDevelopmentServiceWorkers()
    return
  }

  const updateSW = registerSW({
    immediate: false,
    onNeedRefresh() {
      window.dispatchEvent(new CustomEvent('naliv-app-update-ready'))
    },
    onRegisteredSW(swScriptUrl: string | undefined) {
      if (!swScriptUrl) {
        return
      }

      setInterval(() => {
        fetch(swScriptUrl, {
          cache: 'no-store',
          headers: {
            'cache-control': 'no-cache',
          },
        })
      }, 60 * 60 * 1000)
    },
  })

  window.addEventListener('naliv-app-apply-update', () => {
    void updateSW(true)
  })
}

async function unregisterDevelopmentServiceWorkers(): Promise<void> {
  const registrations = await navigator.serviceWorker.getRegistrations()

  await Promise.all(registrations.map((registration) => registration.unregister()))

  if ('caches' in window) {
    const cacheNames = await caches.keys()
    await Promise.all(cacheNames.map((cacheName) => caches.delete(cacheName)))
  }
}
