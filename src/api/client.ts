import axios from 'axios'
import { API_BASE_URL } from '../utils/constants'
import { getCourierToken } from '../utils/tokenStorage'

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 12000,
})

apiClient.interceptors.request.use((config) => {
  if (config.url?.startsWith('/courier/auth/telegram')) {
    return config
  }

  const token = getCourierToken()

  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  return config
})
