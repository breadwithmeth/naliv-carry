/// <reference lib="webworker" />

import { clientsClaim } from 'workbox-core'
import { BackgroundSyncPlugin } from 'workbox-background-sync'
import { ExpirationPlugin } from 'workbox-expiration'
import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching'
import { registerRoute } from 'workbox-routing'
import { NetworkFirst, NetworkOnly, StaleWhileRevalidate } from 'workbox-strategies'

declare let self: ServiceWorkerGlobalScope

autoSkipWaiting()
clientsClaim()
cleanupOutdatedCaches()
precacheAndRoute(self.__WB_MANIFEST)

registerRoute(
  ({ url, request }) =>
    request.method === 'GET' &&
    (url.pathname.startsWith('/api/courier/orders/my-deliveries') ||
      url.pathname.startsWith('/api/courier/auth/profile') ||
      url.pathname.startsWith('/api/courier/cities') ||
      url.pathname.startsWith('/api/courier/location')),
  new NetworkFirst({
    cacheName: 'orders-api-cache',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 80,
        maxAgeSeconds: 60 * 60 * 24,
      }),
    ],
  }),
)

const statusQueuePlugin = new BackgroundSyncPlugin('order-status-update-queue', {
  maxRetentionTime: 24 * 60,
})

registerRoute(
  ({ url, request }) =>
    request.method === 'POST' && /^\/api\/courier\/orders\/[^/]+\/(take|deliver)$/.test(url.pathname),
  new NetworkOnly({
    plugins: [statusQueuePlugin],
  }),
  'POST',
)

registerRoute(
  ({ request }) => request.destination === 'image',
  new StaleWhileRevalidate({
    cacheName: 'image-cache',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 40,
        maxAgeSeconds: 60 * 60 * 24 * 7,
      }),
    ],
  }),
)

registerRoute(
  ({ request }) => request.mode === 'navigate',
  async ({ request, event }) => {
    try {
      const networkFirst = new NetworkFirst({ cacheName: 'app-shell-cache' })
      return await networkFirst.handle({ event, request })
    } catch {
      const cachedOffline = await caches.match('/offline.html')
      return cachedOffline ?? Response.error()
    }
  },
)

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
})

function autoSkipWaiting(): void {
  self.addEventListener('install', () => self.skipWaiting())
}
