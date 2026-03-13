import { apiClient } from './client'
import type {
  ApiResponse,
  ChangePasswordBody,
  CitiesData,
  CourierLocationData,
  CourierProfileData,
  BackendPaymentStatsData,
  PaymentStatsData,
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

interface PaymentStatsQuery {
  shiftId: string
}

export async function getPaymentStats(query: PaymentStatsQuery): Promise<PaymentStatsData> {
  const response = await apiClient.get<ApiResponse<BackendPaymentStatsData>>('/courier/orders/payment-stats', {
    params: {
      shift_id: query.shiftId,
    },
  })

  const source = response.data.data

  return {
    courierId: source.courier_id,
    shift: source.shift
      ? {
          id: source.shift.id,
          startedAt: source.shift.started_at,
          endedAt: source.shift.ended_at,
          status: source.shift.status,
        }
      : null,
    period: {
      startDate: source.period.start_date,
      endDate: source.period.end_date,
    },
    stats: source.stats.map((item) => ({
      paymentTypeId: item.payment_type_id,
      paymentTypeName: item.payment_type_name,
      canceled: item.canceled,
      notCanceled: item.not_canceled,
      canceledAmount: item.canceled_amount ?? 0,
      notCanceledAmount: item.not_canceled_amount ?? 0,
      totalAmount: item.total_amount ?? 0,
    })),
    orders: (source.orders ?? []).map((item) => ({
      orderId: item.order_id,
      paymentTypeId: item.payment_type_id,
      paymentTypeName: item.payment_type_name,
      isCanceled: item.is_canceled,
      amountTotal: item.amount_total ?? 0,
      amountBeforeDelivery: item.amount_before_delivery ?? 0,
      deliveryPrice: item.delivery_price ?? 0,
    })),
    totalPaymentTypes: source.total_payment_types,
  }
}
