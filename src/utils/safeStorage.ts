// iOS WebKit (Telegram iOS WebView) enforces a very low per-domain storage
// quota (~256 KB shared daemon cap) and may throw QuotaExceededError even on
// small payloads. Fall back progressively: localStorage → sessionStorage → memory.
const memoryFallback = new Map<string, string>()

export function safeGetItem(key: string): string | null {
  try {
    const value = window.localStorage.getItem(key)
    if (value !== null) return value
  } catch {
    // ignore and try the next layer
  }

  try {
    const value = window.sessionStorage.getItem(key)
    if (value !== null) return value
  } catch {
    // ignore
  }

  return memoryFallback.get(key) ?? null
}

/**
 * setItem that never throws. On QuotaExceededError it tries sessionStorage,
 * then the in-memory map, and also evicts known non-critical keys from
 * localStorage to retry there. Token (auth) keys must survive the longest.
 */
export function safeSetItem(key: string, value: string): boolean {
  try {
    window.localStorage.setItem(key, value)
    return true
  } catch (error) {
    if (!isQuotaError(error)) {
      // Storage may be completely unavailable — still try the fallback layers.
    }
  }

  // Free space in localStorage by evicting known non-critical keys, retry once.
  const EVICTABLE_KEYS = ['app_error_log', 'naliv-carry-offline-queue']
  for (const evictKey of EVICTABLE_KEYS) {
    if (evictKey === key) continue
    try {
      window.localStorage.removeItem(evictKey)
    } catch {
      // ignore
    }
    try {
      window.localStorage.setItem(key, value)
      return true
    } catch {
      // Still full — continue.
    }
  }

  // Session storage has a higher quota on iOS WebKit than localStorage.
  try {
    window.sessionStorage.setItem(key, value)
    return true
  } catch {
    // ignore
  }

  // Last resort: keep the value for the current page session only.
  try {
    memoryFallback.set(key, value)
    return true
  } catch {
    return false
  }
}

export function safeRemoveItem(key: string): void {
  memoryFallback.delete(key)
  try {
    window.sessionStorage.removeItem(key)
  } catch {
    // ignore
  }
  try {
    window.localStorage.removeItem(key)
  } catch {
    // ignore
  }
}

function isQuotaError(error: unknown): boolean {
  if (error instanceof DOMException) {
    return (
      error.name === 'QuotaExceededError' ||
      error.name === 'NS_ERROR_DOM_QUOTA_REACHED' ||
      error.code === 22 ||
      error.code === 1014
    )
  }
  return error instanceof Error && /quota/i.test(error.message)
}
