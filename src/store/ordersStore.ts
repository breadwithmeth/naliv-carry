import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import {
  cancelOrderClientRejected,
  cancelOrderUnder21,
  deliverOrder,
  getAvailableOrders,
  getDeliveredOrders,
  getOrderById,
  getOrders,
  releaseOrder,
  takeOrder,
  updateOrderStatus,
} from '../api/ordersApi'
import type { DeliveryStatus, Order, ReleaseOrderBody } from '../types/models'
import { enqueueStatusUpdate } from '../utils/offlineQueue'

type OrdersViewMode = 'my' | 'available' | 'delivered'

interface OrdersState {
  orders: Order[]
  availableOrders: Order[]
  deliveredOrders: Order[]
  selectedOrder: Order | null
  mode: OrdersViewMode
  isLoading: boolean
  page: number
  limit: number
  total: number
  deliveredStats: {
    totalDelivered: number
    totalEarnings: number
    avgDeliveryPrice: number
  }
  fetchOrders: (page?: number, limit?: number) => Promise<void>
  fetchAvailableOrders: (cityId: number, page?: number, limit?: number) => Promise<void>
  fetchDeliveredOrders: (startDate: string, endDate: string, page?: number, limit?: number) => Promise<void>
  fetchOrderById: (orderId: string) => Promise<Order | null>
  updateStatus: (orderId: string, status: DeliveryStatus) => Promise<void>
  takeOrder: (orderId: string) => Promise<void>
  deliverOrder: (orderId: string) => Promise<void>
  cancelOrderUnder21: (orderId: string) => Promise<string>
  cancelOrderClientRejected: (orderId: string) => Promise<string>
  releaseOrder: (orderId: string, payload: ReleaseOrderBody) => Promise<string>
  setMode: (mode: OrdersViewMode) => void
}

interface PersistedOrdersState {
  orders?: unknown
  availableOrders?: unknown
  deliveredOrders?: unknown
  page?: unknown
  limit?: unknown
  total?: unknown
  mode?: unknown
}

function normalizeOrders(value: unknown): Order[] {
  return Array.isArray(value) ? (value as Order[]) : []
}

function normalizeNumber(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback
}

function patchOrderStatus(orders: Order[], orderId: string, status: DeliveryStatus): Order[] {
  return orders.map((order) =>
    order.id === orderId ? { ...order, status, updatedAt: new Date().toISOString() } : order,
  )
}

function patchCanceledOrder(
  order: Order,
  status: DeliveryStatus,
  statusCode: number,
  statusName: string,
  timestamp: string,
): Order {
  return {
    ...order,
    status,
    statusCode,
    statusName,
    updatedAt: timestamp,
    statusHistory: [
      ...(order.statusHistory ?? []),
      {
        status: statusCode,
        statusName,
        timestamp,
      },
    ],
  }
}

function patchCanceledOrders(
  orders: Order[],
  orderId: string,
  status: DeliveryStatus,
  statusCode: number,
  statusName: string,
  timestamp: string,
): Order[] {
  return orders.map((order) =>
    order.id === orderId ? patchCanceledOrder(order, status, statusCode, statusName, timestamp) : order,
  )
}

export const useOrdersStore = create<OrdersState>()(
  persist(
    (set) => ({
      orders: [],
      availableOrders: [],
      deliveredOrders: [],
      selectedOrder: null,
      mode: 'my',
      isLoading: false,
      page: 1,
      limit: 20,
      total: 0,
      deliveredStats: {
        totalDelivered: 0,
        totalEarnings: 0,
        avgDeliveryPrice: 0,
      },
      setMode: (mode) => set({ mode }),
      fetchOrders: async (page = 1, limit = 20) => {
        set({ isLoading: true })

        try {
          const response = await getOrders(page, limit)
          set({
            orders: response.orders,
            mode: 'my',
            page: response.pagination.page,
            limit: response.pagination.limit,
            total: response.pagination.total,
          })
        } finally {
          set({ isLoading: false })
        }
      },
      fetchAvailableOrders: async (cityId, page = 1, limit = 20) => {
        set({ isLoading: true })

        try {
          const response = await getAvailableOrders(cityId, page, limit)
          set({
            availableOrders: response.orders,
            mode: 'available',
            page: response.pagination.page,
            limit: response.pagination.limit,
            total: response.pagination.total,
          })
        } finally {
          set({ isLoading: false })
        }
      },
      fetchDeliveredOrders: async (startDate, endDate, page = 1, limit = 20) => {
        set({ isLoading: true })

        try {
          const response = await getDeliveredOrders(startDate, endDate, page, limit)
          set({
            deliveredOrders: response.orders,
            mode: 'delivered',
            page: response.pagination.page,
            limit: response.pagination.limit,
            total: response.pagination.total,
            deliveredStats: {
              totalDelivered: response.statistics.total_delivered,
              totalEarnings: response.statistics.total_earnings,
              avgDeliveryPrice: response.statistics.avg_delivery_price,
            },
          })
        } finally {
          set({ isLoading: false })
        }
      },
      fetchOrderById: async (orderId: string) => {
        try {
          const order = await getOrderById(orderId)
          set((state) => ({
            selectedOrder: order,
            orders: normalizeOrders(state.orders).some((item) => item.id === order.id)
              ? normalizeOrders(state.orders)
              : [...normalizeOrders(state.orders), order],
          }))
          return order
        } catch {
          return null
        }
      },
      updateStatus: async (orderId: string, status: DeliveryStatus) => {
        set((state) => ({
          orders: patchOrderStatus(normalizeOrders(state.orders), orderId, status),
          availableOrders: patchOrderStatus(normalizeOrders(state.availableOrders), orderId, status),
          deliveredOrders: patchOrderStatus(normalizeOrders(state.deliveredOrders), orderId, status),
          selectedOrder:
            state.selectedOrder?.id === orderId
              ? { ...state.selectedOrder, status, updatedAt: new Date().toISOString() }
              : state.selectedOrder,
        }))

        try {
          await updateOrderStatus(orderId, status)
        } catch {
          enqueueStatusUpdate({
            orderId,
            status,
            createdAt: new Date().toISOString(),
          })
          throw new Error('Status update queued for sync')
        }
      },
      takeOrder: async (orderId: string) => {
        await takeOrder(orderId)
        set((state) => ({
          orders: patchOrderStatus(normalizeOrders(state.orders), orderId, 'on_the_way'),
          availableOrders: normalizeOrders(state.availableOrders).filter((order) => order.id !== orderId),
          selectedOrder:
            state.selectedOrder?.id === orderId
              ? { ...state.selectedOrder, status: 'on_the_way', statusCode: 3, statusName: 'Доставляется' }
              : state.selectedOrder,
        }))
      },
      deliverOrder: async (orderId: string) => {
        await deliverOrder(orderId)
        set((state) => {
          const selectedDeliveredOrder: Order | null =
            state.selectedOrder?.id === orderId
              ? {
                  ...state.selectedOrder,
                  status: 'delivered',
                  statusCode: 4,
                  statusName: 'Доставлен',
                }
              : null

          return {
            orders: patchOrderStatus(normalizeOrders(state.orders), orderId, 'delivered'),
            deliveredOrders: normalizeOrders(state.deliveredOrders).some((order) => order.id === orderId)
              ? patchOrderStatus(normalizeOrders(state.deliveredOrders), orderId, 'delivered')
              : [
                  ...normalizeOrders(state.deliveredOrders),
                  ...(selectedDeliveredOrder ? [selectedDeliveredOrder] : []),
                ],
            selectedOrder: selectedDeliveredOrder ?? state.selectedOrder,
          }
        })
      },
      cancelOrderUnder21: async (orderId: string) => {
        const response = await cancelOrderUnder21(orderId)
        const { status, status_name: statusName, timestamp } = response.data.new_status

        set((state) => ({
          orders: patchCanceledOrders(
            normalizeOrders(state.orders),
            orderId,
            'canceled_under_21',
            status,
            statusName,
            timestamp,
          ),
          availableOrders: normalizeOrders(state.availableOrders).filter((order) => order.id !== orderId),
          selectedOrder:
            state.selectedOrder?.id === orderId
              ? patchCanceledOrder(state.selectedOrder, 'canceled_under_21', status, statusName, timestamp)
              : state.selectedOrder,
        }))

        return response.message
      },
      cancelOrderClientRejected: async (orderId: string) => {
        const response = await cancelOrderClientRejected(orderId)
        const { status, status_name: statusName, timestamp } = response.data.new_status

        set((state) => ({
          orders: patchCanceledOrders(
            normalizeOrders(state.orders),
            orderId,
            'canceled_client_rejected',
            status,
            statusName,
            timestamp,
          ),
          availableOrders: normalizeOrders(state.availableOrders).filter((order) => order.id !== orderId),
          selectedOrder:
            state.selectedOrder?.id === orderId
              ? patchCanceledOrder(
                  state.selectedOrder,
                  'canceled_client_rejected',
                  status,
                  statusName,
                  timestamp,
                )
              : state.selectedOrder,
        }))

        return response.message
      },
      releaseOrder: async (orderId: string, payload: ReleaseOrderBody) => {
        const responseMessage = await releaseOrder(orderId, payload)

        set((state) => ({
          orders: normalizeOrders(state.orders).filter((order) => order.id !== orderId),
          availableOrders: normalizeOrders(state.availableOrders).filter((order) => order.id !== orderId),
          selectedOrder: state.selectedOrder?.id === orderId ? null : state.selectedOrder,
        }))

        return responseMessage
      },
    }),
    {
      name: 'naliv-carry-orders',
      merge: (persistedState, currentState) => {
        const persisted = persistedState as PersistedOrdersState
        return {
          ...currentState,
          ...persisted,
          orders: normalizeOrders(persisted?.orders),
          availableOrders: normalizeOrders(persisted?.availableOrders),
          deliveredOrders: normalizeOrders(persisted?.deliveredOrders),
          mode: persisted?.mode === 'available' || persisted?.mode === 'delivered' ? persisted.mode : 'my',
          page: normalizeNumber(persisted?.page, currentState.page),
          limit: normalizeNumber(persisted?.limit, currentState.limit),
          total: normalizeNumber(persisted?.total, currentState.total),
        }
      },
      partialize: (state) => ({
        orders: state.orders,
        availableOrders: state.availableOrders,
        deliveredOrders: state.deliveredOrders,
        mode: state.mode,
        page: state.page,
        limit: state.limit,
        total: state.total,
      }),
    },
  ),
)
