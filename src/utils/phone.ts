export function buildPhoneCallUrl(phone: string | null | undefined): string | undefined {
  const rawPhone = phone?.trim()

  if (!rawPhone || rawPhone === '-') {
    return undefined
  }

  const digits = rawPhone.replace(/\D/g, '')

  if (!digits) {
    return undefined
  }

  const normalizedPhone = rawPhone.startsWith('+') ? `+${digits}` : digits
  return `tel:${normalizedPhone}`
}

export function openPhoneCall(phone: string | null | undefined): boolean {
  const callUrl = buildPhoneCallUrl(phone)

  if (!callUrl) {
    return false
  }

  try {
    const openedWindow = window.open(callUrl, '_self')

    if (openedWindow) {
      return true
    }
  } catch {
    // Some WebViews reject non-http schemes through window.open.
  }

  try {
    window.location.assign(callUrl)
    return true
  } catch {
    return false
  }
}
