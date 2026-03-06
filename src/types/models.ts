export type DeliveryStatus = 'pending' | 'on_the_way' | 'delivered' | 'failed'

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
    serviceFee?: number
    bonusUsed?: number
    subtotal?: number
    totalSum?: number
  }
  extra?: string
  createdAt?: string
  bonus?: number
  updatedAt: string
}

export interface AuthTokens {
  accessToken: string
  refreshToken: string
}

export interface AuthUser {
  id: string
  name: string
  phoneOrEmail: string
}

export interface ApiResponse<T> {
  success: boolean
  data: T
  message: string
}

export interface CourierEmployee {
  employee_id?: number
  courier_id?: number
  login: string
  name?: string
  access_level: string
  keycloak_id?: string
  workforce_employee_id?: string
}

export interface CourierProfileData {
  employee: CourierEmployee
}

export interface ChangePasswordBody {
  currentPassword: string
  newPassword: string
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

export interface LoginRequest {
  phoneOrEmail: string
  password: string
}

export interface LoginResponse {
  user: AuthUser
  tokens: AuthTokens
}
