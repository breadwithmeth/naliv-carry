import axios from 'axios'
import { API_BASE_URL } from '../utils/constants'
import { updateKeycloakToken } from '../utils/keycloak'

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 12000,
})

apiClient.interceptors.request.use(async (config) => {
  const token = await updateKeycloakToken(30)

  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  return config
})
