import { AxiosError } from 'axios'
import { create } from 'zustand'
import { getDeliveredOrders } from '../api/ordersApi'
import { getPaymentStats, getShifts, startShift, stopShift } from '../api/courierApi'
import type { CourierShift, PaymentStatsData, ShiftDeliverySummary } from '../types/models'

interface ShiftsState {
  shifts: CourierShift[]
  activeShift: CourierShift | null
  isLoading: boolean
  isCalculating: boolean
  isPaymentStatsLoading: boolean
  errorMessage: string | null
  summaries: Record<string, ShiftDeliverySummary>
  paymentStats: PaymentStatsData | null
  openShift: () => Promise<void>
  closeShift: () => Promise<void>
  loadShifts: () => Promise<void>
  calculateShiftDeliveries: () => Promise<void>
  loadPaymentStats: (shiftId: string) => Promise<void>
}

function mapError(error: unknown): string {
  if (error instanceof AxiosError) {
    const status = error.response?.status
    const code = error.response?.data?.code as string | undefined

    if (status === 409 || code === 'ACTIVE_SHIFT_EXISTS') {
      return 'У вас уже есть активная смена'
    }

    if (status === 404 || code === 'ACTIVE_SHIFT_NOT_FOUND') {
      return 'Активная смена не найдена'
    }

    if (status === 400) {
      return 'Не удалось определить сотрудника для смены'
    }
  }

  return 'Не удалось выполнить операцию со сменой'
}

export const useShiftsStore = create<ShiftsState>((set, get) => ({
  shifts: [],
  activeShift: null,
  isLoading: false,
  isCalculating: false,
  isPaymentStatsLoading: false,
  errorMessage: null,
  summaries: {},
  paymentStats: null,
  openShift: async () => {
    set({ isLoading: true, errorMessage: null })
    try {
      await startShift()
      await get().loadShifts()
      await get().calculateShiftDeliveries()
    } catch (error) {
      set({ errorMessage: mapError(error) })
      throw error
    } finally {
      set({ isLoading: false })
    }
  },
  closeShift: async () => {
    set({ isLoading: true, errorMessage: null })
    try {
      await stopShift()
      await get().loadShifts()
      await get().calculateShiftDeliveries()
    } catch (error) {
      set({ errorMessage: mapError(error) })
      throw error
    } finally {
      set({ isLoading: false })
    }
  },
  loadShifts: async () => {
    set({ isLoading: true, errorMessage: null })
    try {
      const data = await getShifts()
      const activeShift = data.shifts.find((shift) => shift.status === 'ACTIVE') ?? null
      set({
        shifts: data.shifts,
        activeShift,
      })
    } catch (error) {
      set({ errorMessage: mapError(error) })
      throw error
    } finally {
      set({ isLoading: false })
    }
  },
  calculateShiftDeliveries: async () => {
    const shifts = get().shifts

    if (!shifts.length) {
      set({ summaries: {} })
      return
    }

    set({ isCalculating: true })

    try {
      const results = await Promise.all(
        shifts.map(async (shift) => {
          const startDate = shift.startedAt
          const endDate = shift.endedAt ?? new Date().toISOString()

          try {
            const delivered = await getDeliveredOrders(startDate, endDate, 1, 100)
            return {
              shiftId: shift.id,
              deliveries: delivered.statistics.total_delivered,
              earnings: delivered.statistics.total_earnings,
              avgDeliveryPrice: delivered.statistics.avg_delivery_price,
            } as ShiftDeliverySummary
          } catch {
            return {
              shiftId: shift.id,
              deliveries: 0,
              earnings: 0,
              avgDeliveryPrice: 0,
            } as ShiftDeliverySummary
          }
        }),
      )

      const summaries = results.reduce<Record<string, ShiftDeliverySummary>>((accumulator, item) => {
        accumulator[item.shiftId] = item
        return accumulator
      }, {})

      set({ summaries })
    } finally {
      set({ isCalculating: false })
    }
  },
  loadPaymentStats: async (shiftId: string) => {
    set({ isPaymentStatsLoading: true })

    try {
      const data = await getPaymentStats({ shiftId })
      set({ paymentStats: data })
    } catch {
      set({ paymentStats: null })
    } finally {
      set({ isPaymentStatsLoading: false })
    }
  },
}))
