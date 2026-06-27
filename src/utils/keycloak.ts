import Keycloak from 'keycloak-js'
import type { AuthUser } from '../types/models'
import { clearTokens, getStoredTokens, setTokens } from './tokenStorage'

const enableSilentSso = String(import.meta.env.VITE_KEYCLOAK_SILENT_SSO ?? 'false') === 'true'
const useHashRouter = String(import.meta.env.VITE_ROUTER_MODE ?? 'browser') === 'hash'

function createKeycloak(): Keycloak {
  return new Keycloak({
    url: import.meta.env.VITE_KEYCLOAK_URL ?? 'https://sec.naliv.kz',
    realm: import.meta.env.VITE_KEYCLOAK_REALM ?? 'naliv-prod',
    clientId: import.meta.env.VITE_KEYCLOAK_CLIENT_ID ?? 'naliv-courier',
  })
}

let keycloak = createKeycloak()
let initialized = false
let initPromise: Promise<boolean> | null = null

const KEYCLOAK_CALLBACK_PARAMS = [
  'code',
  'state',
  'session_state',
  'iss',
  'error',
  'error_description',
]

function normalizeHashCallbackUrl(): void {
  if (!useHashRouter) {
    return
  }

  const hashValue = window.location.hash
  const match = hashValue.match(/#([^&]+)&(.+)/)

  if (!match) {
    return
  }

  const hashPath = match[1]
  const possibleParams = match[2]
  const hasAuthParams = KEYCLOAK_CALLBACK_PARAMS.some((param) =>
    new URLSearchParams(possibleParams).has(param),
  )

  if (!hasAuthParams) {
    return
  }

  const normalizedUrl = `${window.location.origin}${window.location.pathname}?${possibleParams}#${hashPath}`
  window.history.replaceState(window.history.state, '', normalizedUrl)
}

function cleanupKeycloakQueryParams(): void {
  const params = new URLSearchParams(window.location.search)
  let changed = false

  for (const key of KEYCLOAK_CALLBACK_PARAMS) {
    if (params.has(key)) {
      params.delete(key)
      changed = true
    }
  }

  if (!changed) {
    return
  }

  const nextSearch = params.toString()
  const nextUrl = `${window.location.origin}${window.location.pathname}${nextSearch ? `?${nextSearch}` : ''}${window.location.hash}`
  window.history.replaceState(window.history.state, '', nextUrl)
}

function hasKeycloakQueryParams(): boolean {
  const params = new URLSearchParams(window.location.search)
  return KEYCLOAK_CALLBACK_PARAMS.some((param) => params.has(param))
}

function buildAppUrl(path: string): string {
  return useHashRouter ? `${window.location.origin}/#${path}` : `${window.location.origin}${path}`
}

function persistCurrentTokens(client = keycloak): void {
  if (!client.token || !client.refreshToken) {
    clearTokens()
    return
  }

  setTokens({
    accessToken: client.token,
    refreshToken: client.refreshToken,
    idToken: client.idToken,
  })
}

export async function initKeycloak(onLoad: 'check-sso' | 'login-required' = 'check-sso'): Promise<boolean> {
  normalizeHashCallbackUrl()

  if (initialized) {
    return keycloak.authenticated ?? false
  }

  if (!initPromise) {
    if (keycloak.didInitialize) {
      keycloak = createKeycloak()
    }

    const activeKeycloak = keycloak
    const initOptions: Parameters<typeof activeKeycloak.init>[0] = {
      pkceMethod: 'S256',
      checkLoginIframe: false,
      onLoad,
    }
    const storedTokens = hasKeycloakQueryParams() ? null : getStoredTokens()

    if (useHashRouter) {
      // Query callback mode avoids collisions with hash-based client routing.
      initOptions.responseMode = 'query'
    }

    if (enableSilentSso) {
      initOptions.silentCheckSsoRedirectUri = `${window.location.origin}/silent-check-sso.html`
    }

    if (storedTokens) {
      initOptions.token = storedTokens.accessToken
      initOptions.refreshToken = storedTokens.refreshToken
      initOptions.idToken = storedTokens.idToken
    }

    initPromise = activeKeycloak
      .init(initOptions)
      .then((authenticated) => {
        initialized = true
        cleanupKeycloakQueryParams()

        if (authenticated) {
          persistCurrentTokens(activeKeycloak)
        } else {
          clearTokens()
        }

        return authenticated
      })
      .catch((error) => {
        cleanupKeycloakQueryParams()
        clearTokens()
        keycloak = createKeycloak()
        throw error
      })
      .finally(() => {
        initPromise = null
      })
  }

  return initPromise
}

export async function keycloakLogin(): Promise<void> {
  await initKeycloak('check-sso')
  await keycloak.login({ redirectUri: buildAppUrl('/dashboard') })
}

export async function keycloakLogout(): Promise<void> {
  clearTokens()
  await keycloak.logout({ redirectUri: buildAppUrl('/login') })
}

export async function updateKeycloakToken(minValidity = 30): Promise<string | null> {
  if (!initialized) {
    await initKeycloak('check-sso')
  }

  if (!keycloak.authenticated) {
    clearTokens()
    return null
  }

  try {
    await keycloak.updateToken(minValidity)
  } catch (error) {
    clearTokens()
    throw error
  }

  persistCurrentTokens()
  return keycloak.token ?? null
}

export function getKeycloakAccessToken(): string | null {
  return keycloak.token ?? null
}

export function isKeycloakAuthenticated(): boolean {
  return Boolean(keycloak.authenticated)
}

export function readKeycloakUser(): AuthUser | null {
  const parsed = keycloak.tokenParsed
  if (!parsed) {
    return null
  }

  const id = String(parsed.sub ?? '')
  const name = String(parsed.name ?? parsed.preferred_username ?? 'Courier')
  const phoneOrEmail = String(parsed.email ?? parsed.preferred_username ?? '-')

  return {
    id,
    name,
    phoneOrEmail,
  }
}
