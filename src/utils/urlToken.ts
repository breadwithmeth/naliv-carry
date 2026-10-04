export type UrlTokenSource = 'courier_token' | 'token'

export interface UrlToken {
  token: string
  source: UrlTokenSource
}

/**
 * Читает magic-link токен из URL.
 * Приоритет: `courier_token` (новый формат ссылки из бота), затем legacy `token`.
 */
export function extractUrlToken(): UrlToken | null {
  if (typeof window === 'undefined') return null
  const params = new URLSearchParams(window.location.search)
  const courierToken = params.get('courier_token')
  if (courierToken) {
    return { token: courierToken, source: 'courier_token' }
  }
  const token = params.get('token')
  if (token) {
    return { token, source: 'token' }
  }
  return null
}

/** Убирает токен из адресной строки, чтобы он не остался в истории/закладках. */
export function clearUrlToken(): void {
  if (typeof window === 'undefined') return
  const url = new URL(window.location.href)
  url.searchParams.delete('courier_token')
  url.searchParams.delete('token')
  window.history.replaceState({}, document.title, url.toString())
}
