/// <reference path="../vite-env.d.ts" />

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
