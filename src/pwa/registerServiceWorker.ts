import { registerSW } from 'virtual:pwa-register'

export function registerServiceWorker(): void {
  registerSW({
    immediate: true,
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
}
