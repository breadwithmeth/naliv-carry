import Keycloak from 'keycloak-js'
import type { AuthUser } from '../types/models'

const keycloak = new Keycloak({
  url: import.meta.env.VITE_KEYCLOAK_URL ?? 'https://sec.naliv.kz',
  realm: import.meta.env.VITE_KEYCLOAK_REALM ?? 'naliv-prod',
  clientId: import.meta.env.VITE_KEYCLOAK_CLIENT_ID ?? 'naliv-courier',
})

const enableSilentSso = String(import.meta.env.VITE_KEYCLOAK_SILENT_SSO ?? 'false') === 'true'
const useHashRouter = String(import.meta.env.VITE_ROUTER_MODE ?? 'browser') === 'hash'

let initialized = false
let initPromise: Promise<boolean> | null = null

function buildAppUrl(path: string): string {
  return useHashRouter ? `${window.location.origin}/#${path}` : `${window.location.origin}${path}`
}

export async function initKeycloak(onLoad: 'check-sso' | 'login-required' = 'check-sso'): Promise<boolean> {
  if (initialized) {
    return keycloak.authenticated ?? false
  }

  if (!initPromise) {
    const initOptions: Parameters<typeof keycloak.init>[0] = {
      onLoad,
      pkceMethod: 'S256',
      checkLoginIframe: false,
    }

    if (enableSilentSso) {
      initOptions.silentCheckSsoRedirectUri = `${window.location.origin}/silent-check-sso.html`
    }

    initPromise = keycloak
      .init(initOptions)
      .then((authenticated) => {
        initialized = true
        return authenticated
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
  await keycloak.logout({ redirectUri: buildAppUrl('/login') })
}

export async function updateKeycloakToken(minValidity = 30): Promise<string | null> {
  if (!initialized) {
    await initKeycloak('check-sso')
  }

  if (!keycloak.authenticated) {
    return null
  }

  await keycloak.updateToken(minValidity)
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
