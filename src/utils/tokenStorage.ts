const ACCESS_TOKEN_KEY = 'naliv-carry-access-token'
const REFRESH_TOKEN_KEY = 'naliv-carry-refresh-token'
const ID_TOKEN_KEY = 'naliv-carry-id-token'

interface StoredTokens {
  accessToken: string
  refreshToken: string
  idToken?: string
}

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
    // If storage is unavailable, keep the in-memory Keycloak session only.
  }
}

function removeStorageItem(key: string): void {
  try {
    localStorage.removeItem(key)
  } catch {
    // Nothing to clear when storage is unavailable.
  }
}

export function getAccessToken(): string | null {
  return getStorageItem(ACCESS_TOKEN_KEY)
}

export function getRefreshToken(): string | null {
  return getStorageItem(REFRESH_TOKEN_KEY)
}

export function getIdToken(): string | null {
  return getStorageItem(ID_TOKEN_KEY)
}

export function getStoredTokens(): StoredTokens | null {
  const accessToken = getAccessToken()
  const refreshToken = getRefreshToken()

  if (!accessToken || !refreshToken) {
    return null
  }

  return {
    accessToken,
    refreshToken,
    idToken: getIdToken() ?? undefined,
  }
}

export function setTokens(tokens: StoredTokens): void {
  setStorageItem(ACCESS_TOKEN_KEY, tokens.accessToken)
  setStorageItem(REFRESH_TOKEN_KEY, tokens.refreshToken)

  if (tokens.idToken) {
    setStorageItem(ID_TOKEN_KEY, tokens.idToken)
  } else {
    removeStorageItem(ID_TOKEN_KEY)
  }
}

export function clearTokens(): void {
  removeStorageItem(ACCESS_TOKEN_KEY)
  removeStorageItem(REFRESH_TOKEN_KEY)
  removeStorageItem(ID_TOKEN_KEY)
}
