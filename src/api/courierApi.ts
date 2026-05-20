import { apiClient } from './client'
import type {
  ApiResponse,
  ChangePasswordBody,
  CitiesData,
  CourierLocationData,
  CourierProfileData,
  BackendShiftPaymentReportData,
  ShiftActionData,
  ShiftPaymentReportData,
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

interface ShiftPaymentReportQuery {
  shiftId?: string
}

export async function getShiftPaymentReport(query: ShiftPaymentReportQuery = {}): Promise<ShiftPaymentReportData> {
  const response = await apiClient.get<ApiResponse<BackendShiftPaymentReportData>>('/courier/shifts/payment-report', {
    params: query.shiftId
      ? {
          shift_id: query.shiftId,
        }
      : undefined,
  })

  const source = response.data.data

  return {
    courierId: source.courier_id,
    employeeId: source.employeeId,
    requestedShiftId: source.requested_shift_id,
    generatedAt: source.generated_at,
    summary: {
      totalShifts: source.summary.total_shifts,
      closedShifts: source.summary.closed_shifts,
      unfinishedShifts: source.summary.unfinished_shifts,
      totalOrders: source.summary.total_orders,
      totalAmount: source.summary.total_amount,
    },
    shifts: source.shifts.map((shiftReport) => ({
      shift: {
        id: shiftReport.shift.id,
        startedAt: shiftReport.shift.started_at,
        endedAt: shiftReport.shift.ended_at,
        status: shiftReport.shift.status,
        isClosed: shiftReport.shift.is_closed,
      },
      period: {
        startDate: shiftReport.period.start_date,
        endDate: shiftReport.period.end_date,
      },
      paymentTypes: shiftReport.payment_types.map((item) => ({
        paymentTypeId: item.payment_type_id,
        paymentTypeName: item.payment_type_name,
        canceled: item.canceled,
        notCanceled: item.not_canceled,
        canceledAmount: item.canceled_amount ?? 0,
        notCanceledAmount: item.not_canceled_amount ?? 0,
        totalAmount: item.total_amount ?? 0,
      })),
      orders: shiftReport.orders.map((item) => ({
        orderId: item.order_id,
        paymentTypeId: item.payment_type_id,
        paymentTypeName: item.payment_type_name,
        isCanceled: item.is_canceled,
        amountTotal: item.amount_total ?? 0,
        deliveryServiceFee: item.delivery_service_fee ?? 0,
        deliveryCost: item.delivery_cost ?? 0,
      })),
      totals: {
        ordersCount: shiftReport.totals.orders_count,
        totalAmount: shiftReport.totals.total_amount,
      },
    })),
  }
}
