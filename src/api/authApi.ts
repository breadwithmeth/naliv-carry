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
    initData: getTelegramInitData(),
  })

  return unwrapApiResponse(response.data)
}

export async function requestCourierAccess(
  form: CourierTelegramRequestAccessBody,
): Promise<CourierTelegramAccessData> {
  const response = await apiClient.post<ApiResponse<CourierTelegramAccessData>>(
    '/courier/auth/telegram/request-access',
    {
      initData: getTelegramInitData(),
      ...form,
    },
  )

  return unwrapApiResponse(response.data)
}

export async function loginCourierByTelegram(): Promise<CourierTelegramLoginData> {
  const response = await apiClient.post<ApiResponse<CourierTelegramLoginData>>('/courier/auth/telegram', {
    initData: getTelegramInitData(),
  })

  const data = unwrapApiResponse(response.data)
  setCourierToken(data.token)
  return data
}
