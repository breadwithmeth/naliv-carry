export type DeliveryStatus =
  | 'pending'
  | 'on_the_way'
  | 'delivered'
  | 'failed'
  | 'canceled_under_21'
  | 'canceled_client_rejected'

export interface CourierProfile {
  id: string
  fullName: string
  phone: string
  email: string
  vehicle?: string
}

export interface Order {
  id: string
  orderUuid?: string
  customerName: string
  customerPhone: string
  businessId?: number
  businessName?: string
  businessAddress?: string
  address: string
  notes?: string
  status: DeliveryStatus
  statusCode?: number
  statusName?: string
  deliveryPrice?: number
  totalCost?: number
  eta?: string
  latitude?: number
  longitude?: number
  businessCity?: number
  deliveryAddressName?: string
  deliveryAddressCoordinates?: {
    lat: number
    lon: number
  }
  deliveryAddressDetails?: {
    apartment?: string
    entrance?: string
    floor?: string
    comment?: string
  }
  paymentTypeName?: string
  statusHistory?: Array<{
    status: number
    statusName: string
    timestamp?: string
  }>
  items?: Array<{
    relationId?: number
    itemId?: number
    name?: string
    description?: string
    image?: string
    amount?: number
    price?: number
    unit?: string
    originalPrice?: number
    totalCost?: number
  }>
  itemsCount?: number
  costSummary?: {
    itemsTotal?: number
    deliveryPrice?: number
    deliveryServiceFee?: number
    serviceFee?: number
    bonusUsed?: number
    subtotal?: number
    totalSum?: number
    discount?: number
    finalTotal?: number
  }
  extra?: string
  createdAt?: string
  bonus?: number
  updatedAt: string
}

export interface AuthUser {
  id: string
  name: string
  phoneOrEmail: string
}

export interface ApiResponse<T> {
  success: boolean
  data: T
  message?: string
  error?: {
    message?: string
  }
}

export type CourierAccessStatus = 'NOT_REQUESTED' | 'PENDING' | 'REJECTED' | 'APPROVED'

export type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue }

export interface CourierAccessRequest {
  request_id: number
  telegram_user_id: string
  telegram_username?: string | null
  full_name: string
  phone: string
  birth_date?: string | null
  iin?: string | null
  city?: string | null
  address?: string | null
  vehicle_type?: string | null
  has_own_vehicle?: boolean | null
  vehicle_make?: string | null
  vehicle_model?: string | null
  vehicle_year?: number | null
  vehicle_color?: string | null
  vehicle_plate?: string | null
  driver_license_number?: string | null
  driver_license_categories?: string | null
  document_type?: string | null
  document_number?: string | null
  emergency_contact_name?: string | null
  emergency_contact_phone?: string | null
  experience_years?: number | null
  preferred_work_area?: string | null
  availability?: string | null
  comment?: string | null
  extra_data?: JsonValue | null
  status: CourierAccessStatus
  rejection_reason?: string | null
  created_at: string
}

export interface TelegramCourier {
  courier_id: number
  login: string
  name: string
  access_level: string
  telegram_user_id: string
  telegram_username?: string | null
}

export interface CourierTelegramAccessData {
  status: CourierAccessStatus
  request: CourierAccessRequest | null
  employee: TelegramCourier | CourierEmployee | null
}

export interface CourierTelegramRequestAccessBody {
  full_name: string
  phone: string
  birth_date?: string
  iin?: string
  city?: string
  address?: string
  vehicle_type?: string
  has_own_vehicle?: boolean
  vehicle_make?: string
  vehicle_model?: string
  vehicle_year?: number
  vehicle_color?: string
  vehicle_plate?: string
  driver_license_number?: string
  driver_license_categories?: string
  document_type?: string
  document_number?: string
  emergency_contact_name?: string
  emergency_contact_phone?: string
  experience_years?: number
  preferred_work_area?: string
  availability?: string
  comment?: string
  extra_data?: JsonValue
}

export interface CourierTelegramLoginData {
  token: string
  courier: TelegramCourier
  is_new_link: boolean
}

export interface CancelOrderData {
  order_id: number
  order_uuid: string
  previous_status: number
  new_status: {
    status: number
    status_name: string
    timestamp: string
    isCanceled: number
  }
}

export type ReleaseReasonCode =
  | 'wrong_order'
  | 'breakdown'
  | 'shift_ended'
  | 'health_issue'
  | 'route_issue'
  | 'store_delay'
  | 'emergency'
  | 'other'

export interface ReleaseReason {
  code: ReleaseReasonCode
  label: string
}

export interface ReleaseOrderBody {
  reason: ReleaseReasonCode
  comment?: string
}

export interface CourierEmployee {
  employee_id?: number
  courier_id?: number
  login: string
  name?: string
  access_level: string
  workforce_employee_id?: string
  telegram_user_id?: string
  telegram_username?: string | null
}

export interface CourierProfileData {
  employee: CourierEmployee
}

export interface City {
  city_id: number
  name: string
}

export interface CitiesData {
  cities: City[]
  total: number
}

export interface CourierLocation {
  lat: number
  lon: number
  updated_at: string
}

export interface CourierLocationData {
  employee_id: number
  location: CourierLocation | null
}

export interface SaveCourierLocationBody {
  lat: number
  lon: number
}

export interface SaveCourierLocationData {
  employee_id: number
  employee_name: string
  location: CourierLocation
}

export type ShiftStatus = 'ACTIVE' | 'CLOSED'

export interface CourierShift {
  id: string
  employeeId: string
  startedAt: string
  endedAt: string | null
  status: ShiftStatus
}

export interface ShiftActionData {
  employeeId: string
  shift: CourierShift
}

export interface ShiftsListData {
  employeeId: string
  shifts: CourierShift[]
  total: number
}

export interface ShiftDeliverySummary {
  shiftId: string
  deliveries: number
  earnings: number
  avgDeliveryPrice: number
}

export interface PaymentTypeStat {
  paymentTypeId: number
  paymentTypeName: string | null
  canceled: number
  notCanceled: number
  canceledAmount: number
  notCanceledAmount: number
  totalAmount: number
}

export interface PaymentStatsPeriod {
  startDate: string
  endDate: string
}

export interface ShiftPaymentReportSummary {
  totalShifts: number
  closedShifts: number
  unfinishedShifts: number
  totalOrders: number
  totalAmount: number
}

export interface ShiftPaymentReportShift {
  shift: {
    id: string
    startedAt: string
    endedAt: string | null
    status: ShiftStatus
    isClosed: boolean
  }
  period: PaymentStatsPeriod
  paymentTypes: PaymentTypeStat[]
  orders: Array<{
    orderId: number
    paymentTypeId: number | null
    paymentTypeName: string | null
    isCanceled: boolean
    amountTotal: number
    deliveryServiceFee: number
    deliveryCost: number
  }>
  totals: {
    ordersCount: number
    totalAmount: number
  }
}

export interface ShiftPaymentReportData {
  courierId: number
  employeeId: string
  requestedShiftId: string | null
  generatedAt: string
  summary: ShiftPaymentReportSummary
  shifts: ShiftPaymentReportShift[]
}

export interface BackendPaymentTypeStat {
  payment_type_id: number
  payment_type_name: string | null
  canceled: number
  not_canceled: number
  canceled_amount?: number
  not_canceled_amount?: number
  total_amount?: number
}

export interface BackendShiftPaymentReportData {
  courier_id: number
  employeeId: string
  requested_shift_id: string | null
  generated_at: string
  summary: {
    total_shifts: number
    closed_shifts: number
    unfinished_shifts: number
    total_orders: number
    total_amount: number
  }
  shifts: Array<{
    shift: {
      id: string
      started_at: string
      ended_at: string | null
      status: ShiftStatus
      is_closed: boolean
    }
    period: {
      start_date: string
      end_date: string
    }
    payment_types: BackendPaymentTypeStat[]
    orders: Array<{
      order_id: number
      payment_type_id: number | null
      payment_type_name: string | null
      is_canceled: boolean
      amount_total?: number
      delivery_service_fee?: number
      delivery_cost?: number
    }>
    totals: {
      orders_count: number
      total_amount: number
    }
  }>
}

export interface BackendDeliveryOrder {
  order_id: number
  order_uuid: string | null
  business?: {
    business_id: number
    name: string
    address?: string
    coordinates?: {
      lat: number
      lon: number
    }
    city?: number
  }
  user?: {
    user_id: number
    name: string
    phone?: string
    phone_number?: string
  }
  delivery_address?: {
    address_id: number
    name?: string
    address: string
    coordinates?: {
      lat: number
      lon: number
    }
    details?: {
      apartment?: string
      entrance?: string
      floor?: string
      comment?: string
    }
  }
  delivery_type?: string | null
  delivery_date?: string | null
  payment_type?: {
    payment_type_id: number
    name: string
  }
  delivery_price?: number
  total_cost?: number
  status?: {
    status: number
    status_name: string
  }
  current_status?: {
    status: number
    status_name: string
    timestamp?: string
    isCanceled?: number
  }
  items_count?: number
  extra?: string
  created_at?: string
  bonus?: number
}

export interface MyDeliveriesData {
  orders: BackendDeliveryOrder[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
}

export interface AvailableOrdersData {
  orders: BackendDeliveryOrder[]
  pagination: MyDeliveriesData['pagination']
}

export interface DeliveredOrdersStatistics {
  total_delivered: number
  total_earnings: number
  avg_delivery_price: number
}

export interface DeliveredOrdersData {
  orders: BackendDeliveryOrder[]
  statistics: DeliveredOrdersStatistics
  pagination: MyDeliveriesData['pagination']
}

export interface BackendOrderStatusHistory {
  status: number
  status_name: string
  timestamp?: string
  created_at?: string
}

export interface BackendOrderItem {
  relation_id?: number
  item_id?: number
  name?: string
  description?: string
  img?: string
  amount?: number
  unit?: string
  original_price?: number
  total_cost?: number
  quantity?: number
  price?: number
  options?: Array<{
    option_id?: number
    name?: string
    value?: string
    price?: number
  }>
}

export interface BackendOrderCostSummary {
  items_total?: number
  products_total?: number
  delivery_price?: number
  delivery_service_fee?: number
  service_fee?: number
  bonus_used?: number
  subtotal?: number
  total_sum?: number
  discount?: number
  final_total?: number
}

export interface BackendOrderDetailsData {
  order: BackendDeliveryOrder & {
    status_history?: BackendOrderStatusHistory[]
    items?: BackendOrderItem[]
    cost_summary?: BackendOrderCostSummary
  }
}
