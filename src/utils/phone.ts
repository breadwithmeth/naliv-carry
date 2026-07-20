/// <reference path="../vite-env.d.ts" />
/// <reference types="vite/client" />

// WebRTC configuration from environment variables
const WEBRTC_WS_URL: string = import.meta.env.VITE_WEBRTC_WS_URL || 'wss://jasmine.naliv.kz:8089/asterisk/ws'
const WEBRTC_LOGIN: string = import.meta.env.VITE_WEBRTC_LOGIN || ''
const WEBRTC_PASSWORD: string = import.meta.env.VITE_WEBRTC_PASSWORD || ''

interface WebRTCConnection {
  ws: WebSocket
  resolve: (value: boolean) => void
  reject: (reason?: any) => void
}

let activeWebRTCConnection: WebRTCConnection | null = null

export function buildPhoneCallUrl(phone: string | null | undefined): string | undefined {
  const rawPhone = phone?.trim()

  if (!rawPhone || rawPhone === '-') {
    return undefined
  }

  const digits = rawPhone.replace(/\D/g, '')

  if (!digits) {
    return undefined
  }

  let normalizedPhone: string

  if (rawPhone.startsWith('+')) {
    normalizedPhone = `+${digits}`
  } else if (digits.length === 10) {
    normalizedPhone = `+7${digits}`
  } else if (digits.length === 11 && digits.startsWith('8')) {
    normalizedPhone = `+7${digits.slice(1)}`
  } else if (digits.length === 11 && digits.startsWith('7')) {
    normalizedPhone = `+${digits}`
  } else {
    normalizedPhone = digits
  }

  return `https://carry.naliv.kz/call/${normalizedPhone}`
}

export async function callViaWebRTC(phone: string | null | undefined): Promise<boolean> {
  const normalizedPhone = phone?.trim()
  if (!normalizedPhone || !WEBRTC_WS_URL || !WEBRTC_LOGIN || !WEBRTC_PASSWORD) {
    return false
  }

  // Close any existing connection
  if (activeWebRTCConnection) {
    try {
      activeWebRTCConnection.ws.close()
    } catch {
      // Ignore close errors
    }
    activeWebRTCConnection = null
  }

  return new Promise((resolve, reject) => {
    try {
      const ws = new WebSocket(WEBRTC_WS_URL)
      
      // Store connection to clean up later
      activeWebRTCConnection = { ws, resolve, reject }

      ws.onopen = () => {
        try {
          // Authenticate with Asterisk WebSocket
          const authMessage = {
            action: 'login',
            username: WEBRTC_LOGIN,
            secret: WEBRTC_PASSWORD,
          }
          ws.send(JSON.stringify(authMessage))
        } catch (e) {
          cleanup()
          resolve(false)
        }
      }

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          
          // Check if auth was successful
          if (data.result === 'success' || data.type === 'auth_success') {
            // Send call originate command
            const callMessage = {
              action: 'originate',
              endpoint: `PJSIP/${normalizedPhone}`,
              context: 'default',
              exten: normalizedPhone,
              priority: 1,
            }
            ws.send(JSON.stringify(callMessage))
          } else if (data.result === 'error') {
            cleanup()
            resolve(false)
          }
        } catch (e) {
          // Ignore message parse errors
        }
      }

      ws.onerror = () => {
        cleanup()
        resolve(false)
      }

      ws.onclose = () => {
        cleanup()
        resolve(false)
      }

      // Cleanup function
      const cleanup = () => {
        if (activeWebRTCConnection?.ws === ws) {
          activeWebRTCConnection = null
        }
        try {
          ws.close()
        } catch {
          // Ignore
        }
      }

      // Set timeout for connection
      setTimeout(() => {
        cleanup()
        resolve(false)
      }, 10000)

    } catch (e) {
      activeWebRTCConnection = null
      resolve(false)
    }
  })
}

export function closeWebRTCConnection(): void {
  if (activeWebRTCConnection) {
    try {
      activeWebRTCConnection.ws.close()
    } catch {
      // Ignore
    }
    activeWebRTCConnection = null
  }
}

export function openPhoneCall(phone: string | null | undefined): boolean {
  const url = buildPhoneCallUrl(phone)
  if (!url) {
    return false
  }

  try {
    const webApp = window.Telegram?.WebApp

    if (webApp?.openLink) {
      // Telegram Mini App: openLink supports only http/https.
      // The /call/ endpoint should redirect to tel: on the server side,
      // or Telegram may handle it via its native phone call UI.
      webApp.openLink(url)
      return true
    }

    // Outside Telegram: try direct tel: link first
    const digits = phone?.replace(/\D/g, '') || ''
    if (digits) {
      window.location.href = `tel:${digits}`
      return true
    }

    window.location.href = url
    return true
  } catch {
    return false
  }
}

export function copyPhoneNumber(phone: string | null | undefined): Promise<boolean> {
  const rawPhone = phone?.trim()

  if (!rawPhone || rawPhone === '-') {
    return Promise.resolve(false)
  }

  const digits = rawPhone.replace(/\D/g, '')

  if (!digits) {
    return Promise.resolve(false)
  }

  let normalizedPhone: string

  if (rawPhone.startsWith('+')) {
    normalizedPhone = `+${digits}`
  } else if (digits.length === 10) {
    normalizedPhone = `+7${digits}`
  } else if (digits.length === 11 && digits.startsWith('8')) {
    normalizedPhone = `+7${digits.slice(1)}`
  } else if (digits.length === 11 && digits.startsWith('7')) {
    normalizedPhone = `+${digits}`
  } else {
    normalizedPhone = digits
  }

  if (navigator.clipboard?.writeText) {
    return navigator.clipboard
      .writeText(normalizedPhone)
      .then(() => true)
      .catch(() => false)
  }

  return Promise.resolve(false)
}
