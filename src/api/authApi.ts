import axios from 'axios'
import { apiClient } from './client'
import type {
  ApiResponse,
  CourierTelegramAccessData,
  CourierTelegramLoginData,
  CourierTelegramRequestAccessBody,
} from '../types/models'
import { setCourierToken } from '../utils/tokenStorage'
import { getTelegramInitData } from '../utils/telegram'

function unwrapApiResponse<T>(response: ApiResponse<T>): T {
  if (!response.success) {
    throw new Error(response.error?.message || response.message || 'Ошибка запроса')
  }

  return response.data
}

export async function getCourierAccessStatus(): Promise<CourierTelegramAccessData> {
  const response = await apiClient.post<ApiResponse<CourierTelegramAccessData>>('/courier/auth/telegram/status', {
    initData: await getTelegramInitData(),
  })

  return unwrapApiResponse(response.data)
}

export async function requestCourierAccess(
  form: CourierTelegramRequestAccessBody,
): Promise<CourierTelegramAccessData> {
  const response = await apiClient.post<ApiResponse<CourierTelegramAccessData>>(
    '/courier/auth/telegram/request-access',
    {
      initData: await getTelegramInitData(),
      ...form,
    },
  )

  return unwrapApiResponse(response.data)
}

export async function loginCourierByTelegram(): Promise<CourierTelegramLoginData> {
  const response = await apiClient.post<ApiResponse<CourierTelegramLoginData>>('/courier/auth/telegram', {
    initData: await getTelegramInitData(),
  })

  const data = unwrapApiResponse(response.data)
  setCourierToken(data.token)
  return data
}

export async function loginCourierByToken(token: string): Promise<CourierTelegramLoginData> {
  const response = await apiClient.post<ApiResponse<CourierTelegramLoginData>>('/courier/auth/token', {
    token,
  })

  const data = unwrapApiResponse(response.data)
  setCourierToken(data.token)
  return data
}

const MAGIC_LINK_ERRORS: Record<number, string> = {
  401: 'Ссылка недействительна или срок её действия истёк. Запросите новую ссылку в боте (/login)',
  429: 'Слишком много попыток входа. Повторите позже',
  404: 'Сервис входа по ссылке недоступен',
}

export async function loginCourierByMagicLink(token: string): Promise<CourierTelegramLoginData> {
  let data: CourierTelegramLoginData
  try {
    const response = await apiClient.post<ApiResponse<CourierTelegramLoginData>>('/courier/auth/magic-link', {
      token,
    })
    data = unwrapApiResponse(response.data)
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      const status = error.response.status
      const fallback = error.response.data as ApiResponse<unknown> | undefined
      throw new Error(
        MAGIC_LINK_ERRORS[status] || fallback?.error?.message || fallback?.message || 'Не удалось войти по ссылке',
      )
    }
    throw error
  }

  setCourierToken(data.token)
  return data
}
