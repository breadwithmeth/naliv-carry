import { safeGetItem, safeRemoveItem, safeSetItem } from './safeStorage'

const COURIER_TOKEN_KEY = 'courier_token'

export function getCourierToken(): string | null {
  return safeGetItem(COURIER_TOKEN_KEY)
}

export function setCourierToken(token: string): void {
  safeSetItem(COURIER_TOKEN_KEY, token)
}

export function clearCourierToken(): void {
  safeRemoveItem(COURIER_TOKEN_KEY)
}
