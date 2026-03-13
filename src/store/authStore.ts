import { create } from 'zustand'
import type { AuthUser } from '../types/models'
import { getCourierProfile } from '../api/courierApi'
import {
  getKeycloakAccessToken,
  initKeycloak,
  isKeycloakAuthenticated,
  keycloakLogin,
  keycloakLogout,
} from '../utils/keycloak.ts'

interface AuthState {
  user: AuthUser | null
  accessToken: string | null
  isAuthenticated: boolean
  isInitialized: boolean
  isLoading: boolean
  initialize: () => Promise<void>
  login: () => Promise<void>
  refreshToken: () => Promise<void>
  logout: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  isAuthenticated: false,
  isInitialized: false,
  isLoading: false,
  initialize: async () => {
    set({ isLoading: true })
    try {
      await initKeycloak('check-sso')
      const accessToken = getKeycloakAccessToken()

      let user: AuthUser | null = null
      if (isKeycloakAuthenticated()) {
        try {
          const profile = await getCourierProfile()
          const employee = profile.employee
          const resolvedId =
            employee.workforce_employee_id ??
            employee.keycloak_id ??
            (employee.employee_id ? String(employee.employee_id) : null) ??
            (employee.courier_id ? String(employee.courier_id) : null) ??
            'unknown'

          user = {
            id: resolvedId,
            name: employee.name ?? employee.login,
            phoneOrEmail: employee.login,
          }
        } catch {
          user = null
        }
      }

      set({
        user,
        accessToken,
        isAuthenticated: isKeycloakAuthenticated(),
        isInitialized: true,
      })
    } catch {
      set({
        user: null,
        accessToken: null,
        isAuthenticated: false,
        isInitialized: true,
      })
    } finally {
      set({ isLoading: false })
    }
  },
  login: async () => {
    await keycloakLogin()
  },
  refreshToken: async () => {
    const accessToken = getKeycloakAccessToken()
    set({
      accessToken,
      isAuthenticated: isKeycloakAuthenticated(),
    })
  },
  logout: async () => {
    set({ isLoading: true })
    try {
      await keycloakLogout()
    } finally {
      set({
        user: null,
        accessToken: null,
        isAuthenticated: false,
        isLoading: false,
      })
    }
  },
}))
