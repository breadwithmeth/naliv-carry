import { Input, Select, Space, Typography } from 'antd'
import { useEffect, useMemo, useState } from 'react'
import { OrderCard } from '../features/orders/OrderCard'
import { useOrdersStore } from '../store/ordersStore'
import type { DeliveryStatus } from '../types/models'

const statusOptions = [
  { value: 'all', label: 'Все статусы' },
  { value: 'pending', label: 'В ожидании' },
  { value: 'on_the_way', label: 'В пути' },
  { value: 'delivered', label: 'Доставлен' },
  { value: 'failed', label: 'Не доставлен' },
]

export function OrdersPage() {
  const setMode = useOrdersStore((state) => state.setMode)
  const myOrders = useOrdersStore((state) => (Array.isArray(state.orders) ? state.orders : []))
  const fetchOrders = useOrdersStore((state) => state.fetchOrders)

  const [query, setQuery] = useState('')
  const [status, setStatus] = useState<'all' | DeliveryStatus>('all')

  useEffect(() => {
    setMode('my')
    fetchOrders().catch(() => {
      // Ignored: page may use persisted/offline data.
    })
  }, [fetchOrders, setMode])

  const filteredOrders = useMemo(() => {
    return myOrders.filter((order) => {
      const searchMatch = `${order.customerName} ${order.address} ${order.customerPhone}`
        .toLowerCase()
        .includes(query.toLowerCase())

      const statusMatch = status === 'all' || order.status === status

      return searchMatch && statusMatch
    })
  }, [myOrders, query, status])

  return (
    <>
      <Typography.Title level={4} style={{ margin: 0 }}>
        Мои доставки
      </Typography.Title>
      <Space direction="vertical" style={{ width: '100%' }}>
        <Input.Search
          className="touch-action"
          placeholder="Поиск по клиенту, адресу, телефону"
          allowClear
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        <Select
          className="touch-action"
          options={statusOptions}
          value={status}
          onChange={(value) => setStatus(value)}
        />
      </Space>

      <Space direction="vertical" style={{ width: '100%' }}>
        {filteredOrders.map((order) => (
          <OrderCard key={order.id} order={order} />
        ))}
      </Space>
    </>
  )
}
