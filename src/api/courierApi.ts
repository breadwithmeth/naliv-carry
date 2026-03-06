import { apiClient } from './client'
import type {
  ApiResponse,
  ChangePasswordBody,
  CitiesData,
  CourierLocationData,
  CourierProfileData,
  ShiftActionData,
  ShiftsListData,
  SaveCourierLocationBody,
  SaveCourierLocationData,
} from '../types/models'

export async function getCourierProfile(): Promise<CourierProfileData> {
  const response = await apiClient.get<ApiResponse<CourierProfileData>>('/courier/auth/profile')
  return response.data.data
}

export async function changeCourierPassword(payload: ChangePasswordBody): Promise<void> {
  await apiClient.put<ApiResponse<null>>('/courier/auth/change-password', payload)
}

export async function getCities(): Promise<CitiesData> {
  const response = await apiClient.get<ApiResponse<CitiesData>>('/courier/cities')
  return response.data.data
}

export async function getCourierLocation(): Promise<CourierLocationData> {
  const response = await apiClient.get<ApiResponse<CourierLocationData>>('/courier/location')
  return response.data.data
}

export async function saveCourierLocation(payload: SaveCourierLocationBody): Promise<SaveCourierLocationData> {
  const response = await apiClient.post<ApiResponse<SaveCourierLocationData>>('/courier/location', payload)
  return response.data.data
}

export async function startShift(): Promise<ShiftActionData> {
  const response = await apiClient.post<ApiResponse<ShiftActionData>>('/courier/shifts/start')
  return response.data.data
}

export async function stopShift(): Promise<ShiftActionData> {
  const response = await apiClient.post<ApiResponse<ShiftActionData>>('/courier/shifts/stop')
  return response.data.data
}

export async function getShifts(): Promise<ShiftsListData> {
  const response = await apiClient.get<ApiResponse<ShiftsListData>>('/courier/shifts')
  return response.data.data
}
