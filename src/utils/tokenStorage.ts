const COURIER_TOKEN_KEY = 'courier_token'

function getStorageItem(key: string): string | null {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

function setStorageItem(key: string, value: string): void {
  try {
    localStorage.setItem(key, value)
  } catch {
    // If storage is unavailable, the current Telegram login cannot be persisted.
  }
}

function removeStorageItem(key: string): void {
  try {
    localStorage.removeItem(key)
  } catch {
    // Nothing to clear when storage is unavailable.
  }
}

export function getCourierToken(): string | null {
  return getStorageItem(COURIER_TOKEN_KEY)
}

export function setCourierToken(token: string): void {
  setStorageItem(COURIER_TOKEN_KEY, token)
}

export function clearCourierToken(): void {
  removeStorageItem(COURIER_TOKEN_KEY)
}
