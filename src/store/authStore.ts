import { create } from 'zustand'
import {
  getCourierAccessStatus,
  loginCourierByTelegram,
  loginCourierByToken,
  requestCourierAccess,
} from '../api/authApi'
import type {
  AuthUser,
  CourierAccessRequest,
  CourierAccessStatus,
  CourierEmployee,
  CourierTelegramRequestAccessBody,
  TelegramCourier,
} from '../types/models'
import { clearCourierToken, getCourierToken } from '../utils/tokenStorage'

interface AuthState {
  user: AuthUser | null
  accessToken: string | null
  accessStatus: CourierAccessStatus | null
  accessRequest: CourierAccessRequest | null
  statusEmployee: TelegramCourier | CourierEmployee | null
  authError: string | null
  isAuthenticated: boolean
  isInitialized: boolean
  isLoading: boolean
  initialize: () => Promise<void>
  login: () => Promise<void>
  loginByToken: (token: string) => Promise<void>
  requestAccess: (form: CourierTelegramRequestAccessBody) => Promise<void>
  logout: () => Promise<void>
}

let initializePromise: Promise<void> | null = null

function getErrorMessage(error: unknown): string {
  return error instanceof Error && error.message.trim() ? error.message : 'Не удалось проверить доступ'
}

function getCourierId(courier: TelegramCourier | CourierEmployee): string {
  return (
    ('workforce_employee_id' in courier ? courier.workforce_employee_id : undefined) ??
    (courier.courier_id ? String(courier.courier_id) : undefined) ??
    ('employee_id' in courier && courier.employee_id ? String(courier.employee_id) : undefined) ??
    courier.telegram_user_id ??
    courier.login
  )
}

function toAuthUser(courier: TelegramCourier | CourierEmployee): AuthUser {
  return {
    id: getCourierId(courier),
    name: courier.name ?? courier.login,
    phoneOrEmail: courier.telegram_username ? `@${courier.telegram_username}` : courier.login,
  }
}

function extractTokenFromUrl(): string | null {
  if (typeof window === 'undefined') return null
  const params = new URLSearchParams(window.location.search)
  return params.get('token')
}

function clearTokenFromUrl(): void {
  if (typeof window === 'undefined') return
  const url = new URL(window.location.href)
  url.searchParams.delete('token')
  window.history.replaceState({}, document.title, url.toString())
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  accessStatus: null,
  accessRequest: null,
  statusEmployee: null,
  authError: null,
  isAuthenticated: false,
  isInitialized: false,
  isLoading: false,
  initialize: async () => {
    if (initializePromise) {
      return initializePromise
    }

    initializePromise = (async () => {
      set({ isLoading: true, authError: null })

      try {
        // First check if there's a token in the URL
        const urlToken = extractTokenFromUrl()
        if (urlToken) {
          clearTokenFromUrl()
          const loginData = await loginCourierByToken(urlToken)
          set({
            user: toAuthUser(loginData.courier),
            accessToken: loginData.token,
            accessStatus: 'APPROVED',
            accessRequest: null,
            statusEmployee: loginData.courier,
            isAuthenticated: true,
            isInitialized: true,
          })
          return
        }

        // Check if there's a stored token
        const storedToken = getCourierToken()
        if (storedToken) {
          try {
            const loginData = await loginCourierByToken(storedToken)
            set({
              user: toAuthUser(loginData.courier),
              accessToken: loginData.token,
              accessStatus: 'APPROVED',
              accessRequest: null,
              statusEmployee: loginData.courier,
              isAuthenticated: true,
              isInitialized: true,
            })
            return
          } catch {
            // Token is invalid, clear it and continue with normal flow
            clearCourierToken()
          }
        }

        // Normal Telegram auth flow
        const statusData = await getCourierAccessStatus()

        if (statusData.status !== 'APPROVED') {
          clearCourierToken()
          set({
            user: null,
            accessToken: null,
            accessStatus: statusData.status,
            accessRequest: statusData.request,
            statusEmployee: statusData.employee,
            isAuthenticated: false,
            isInitialized: true,
          })
          return
        }

        const loginData = await loginCourierByTelegram()

        set({
          user: toAuthUser(loginData.courier),
          accessToken: loginData.token,
          accessStatus: statusData.status,
          accessRequest: statusData.request,
          statusEmployee: loginData.courier,
          isAuthenticated: true,
          isInitialized: true,
        })
      } catch (error) {
        clearCourierToken()
        set({
          user: null,
          accessToken: null,
          authError: getErrorMessage(error),
          isAuthenticated: false,
          isInitialized: true,
        })
      } finally {
        set({ isLoading: false })
        initializePromise = null
      }
    })()

    return initializePromise
  },
  login: async () => {
    set({ isLoading: true, authError: null })
    try {
      const loginData = await loginCourierByTelegram()
      set({
        user: toAuthUser(loginData.courier),
        accessToken: loginData.token,
        accessStatus: 'APPROVED',
        accessRequest: null,
        statusEmployee: loginData.courier,
        isAuthenticated: true,
        isInitialized: true,
      })
    } catch (error) {
      clearCourierToken()
      set({
        user: null,
        accessToken: null,
        authError: getErrorMessage(error),
        isAuthenticated: false,
        isInitialized: true,
      })
      throw error
    } finally {
      set({ isLoading: false })
    }
  },
  loginByToken: async (token: string) => {
    set({ isLoading: true, authError: null })
    try {
      const loginData = await loginCourierByToken(token)
      set({
        user: toAuthUser(loginData.courier),
        accessToken: loginData.token,
        accessStatus: 'APPROVED',
        accessRequest: null,
        statusEmployee: loginData.courier,
        isAuthenticated: true,
        isInitialized: true,
      })
    } catch (error) {
      clearCourierToken()
      set({
        user: null,
        accessToken: null,
        authError: getErrorMessage(error),
        isAuthenticated: false,
        isInitialized: true,
      })
      throw error
    } finally {
      set({ isLoading: false })
    }
  },
  requestAccess: async (form) => {
    set({ isLoading: true, authError: null })
    try {
      const statusData = await requestCourierAccess(form)
      clearCourierToken()
      set({
        user: null,
        accessToken: null,
        accessStatus: statusData.status,
        accessRequest: statusData.request,
        statusEmployee: statusData.employee,
        isAuthenticated: false,
        isInitialized: true,
      })
    } catch (error) {
      set({ authError: getErrorMessage(error), isInitialized: true })
      throw error
    } finally {
      set({ isLoading: false })
    }
  },
  logout: async () => {
    clearCourierToken()
    set({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      isInitialized: true,
      isLoading: false,
    })
  },
}))
