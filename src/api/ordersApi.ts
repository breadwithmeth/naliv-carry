import { apiClient } from './client'
import type {
  ApiResponse,
  AvailableOrdersData,
  BackendDeliveryOrder,
  BackendOrderDetailsData,
  DeliveredOrdersData,
  DeliveryStatus,
  MyDeliveriesData,
  Order,
} from '../types/models'

function normalizeStatus(statusName?: string, statusCode?: number): DeliveryStatus {
  if (statusCode === 3) {
    return 'on_the_way'
  }
  if (statusCode === 4) {
    return 'delivered'
  }
  if (statusCode === 5) {
    return 'failed'
  }

  const value = (statusName ?? '').toLowerCase()

  if (value.includes('доставляется') || value.includes('on the way')) {
    return 'on_the_way'
  }
  if (value.includes('доставлен') || value.includes('delivered')) {
    return 'delivered'
  }
  if (value.includes('не доставлен') || value.includes('failed')) {
    return 'failed'
  }

  return 'pending'
}

function mapBackendOrder(item: BackendDeliveryOrder): Order {
  const statusCode = item.current_status?.status ?? item.status?.status
  const statusName = item.current_status?.status_name ?? item.status?.status_name
  const resolvedPhone = item.user?.phone ?? item.user?.phone_number ?? '-'

  return {
    id: String(item.order_id),
    orderUuid: item.order_uuid ?? undefined,
    customerName: item.user?.name ?? 'Customer',
    customerPhone: resolvedPhone,
    businessId: item.business?.business_id,
    businessName: item.business?.name,
    businessAddress: item.business?.address,
    businessCity: item.business?.city,
    address: item.delivery_address?.address ?? item.business?.address ?? '-',
    notes: `Order UUID: ${item.order_uuid}`,
    status: normalizeStatus(statusName, statusCode),
    statusCode,
    statusName,
    deliveryPrice: item.delivery_price,
    totalCost: item.total_cost,
    deliveryAddressName: item.delivery_address?.name,
    deliveryAddressCoordinates: item.delivery_address?.coordinates,
    deliveryAddressDetails: item.delivery_address?.details,
    paymentTypeName: item.payment_type?.name,
    statusHistory: item.status ? [{ status: item.status.status, statusName: item.status.status_name }] : undefined,
    itemsCount: item.items_count,
    extra: item.extra,
    createdAt: item.created_at,
    bonus: item.bonus,
    latitude: item.business?.coordinates?.lat,
    longitude: item.business?.coordinates?.lon,
    updatedAt: new Date().toISOString(),
  }
}

export async function getOrders(page = 1, limit = 20): Promise<{ orders: Order[]; pagination: MyDeliveriesData['pagination'] }> {
  const response = await apiClient.get<ApiResponse<MyDeliveriesData>>('/courier/orders/my-deliveries', {
    params: { page, limit },
  })

  return {
    orders: response.data.data.orders.map(mapBackendOrder),
    pagination: response.data.data.pagination,
  }
}

export async function getAvailableOrders(
  cityId: number,
  page = 1,
  limit = 20,
): Promise<{ orders: Order[]; pagination: MyDeliveriesData['pagination'] }> {
  const response = await apiClient.get<ApiResponse<AvailableOrdersData>>('/courier/orders/available', {
    params: { city: cityId, page, limit },
  })

  return {
    orders: response.data.data.orders.map(mapBackendOrder),
    pagination: response.data.data.pagination,
  }
}

export async function getDeliveredOrders(
  startDate: string,
  endDate: string,
  page = 1,
  limit = 20,
): Promise<{
  orders: Order[]
  statistics: DeliveredOrdersData['statistics']
  pagination: MyDeliveriesData['pagination']
}> {
  const response = await apiClient.get<ApiResponse<DeliveredOrdersData>>('/courier/orders/delivered', {
    params: {
      start_date: startDate,
      end_date: endDate,
      page,
      limit,
    },
  })

  return {
    orders: response.data.data.orders.map(mapBackendOrder),
    statistics: response.data.data.statistics,
    pagination: response.data.data.pagination,
  }
}

export async function getOrderById(orderId: string): Promise<Order> {
  const response = await apiClient.get<ApiResponse<BackendOrderDetailsData>>(`/courier/orders/${orderId}`)
  const sourceOrder = response.data.data.order
  const order = mapBackendOrder(sourceOrder)

  order.statusHistory = sourceOrder.status_history?.map((item) => ({
    status: item.status,
    statusName: item.status_name,
    timestamp: item.timestamp ?? item.created_at,
  }))

  order.items = sourceOrder.items?.map((item) => ({
    relationId: item.relation_id,
    itemId: item.item_id,
    name: item.name,
    description: item.description,
    image: item.img,
    amount: item.amount ?? item.quantity,
    price: item.price,
    unit: item.unit,
    originalPrice: item.original_price,
    totalCost: item.total_cost,
  }))

  order.costSummary = sourceOrder.cost_summary
    ? {
        itemsTotal: sourceOrder.cost_summary.items_total ?? sourceOrder.cost_summary.products_total,
        deliveryPrice: sourceOrder.cost_summary.delivery_price,
        serviceFee: sourceOrder.cost_summary.service_fee,
        bonusUsed: sourceOrder.cost_summary.bonus_used,
        subtotal: sourceOrder.cost_summary.subtotal,
        totalSum: sourceOrder.cost_summary.total_sum ?? sourceOrder.cost_summary.final_total,
      }
    : undefined

  order.notes = sourceOrder.delivery_address?.details?.comment ?? order.notes

  return order
}

export async function takeOrder(orderId: string): Promise<void> {
  await apiClient.post(`/courier/orders/${orderId}/take`)
}

export async function deliverOrder(orderId: string): Promise<void> {
  await apiClient.post(`/courier/orders/${orderId}/deliver`)
}

export async function updateOrderStatus(orderId: string, status: DeliveryStatus): Promise<void> {
  if (status === 'on_the_way') {
    await takeOrder(orderId)
    return
  }

  if (status === 'delivered') {
    await deliverOrder(orderId)
    return
  }

  throw new Error('Unsupported status transition')
}
