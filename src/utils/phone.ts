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

  return `tel:${normalizedPhone}`
}
