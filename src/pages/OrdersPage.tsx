import { Button, Empty, Input, Segmented, Space, Spin } from 'antd'
import { useEffect, useMemo, useState } from 'react'
import { OrderCard } from '../features/orders/OrderCard'
import { useOrdersStore } from '../store/ordersStore'

type StatusFilter = 'active' | 'all' | 'done' | 'problem'

const statusFilterOptions = [
  { value: 'active', label: 'Активные' },
  { value: 'all', label: 'Все' },
  { value: 'done', label: 'Выданы' },
  { value: 'problem', label: 'Проблемы' },
]

export function OrdersPage() {
  const setMode = useOrdersStore((state) => state.setMode)
  const myOrders = useOrdersStore((state) => (Array.isArray(state.orders) ? state.orders : []))
  const fetchOrders = useOrdersStore((state) => state.fetchOrders)
  const isLoading = useOrdersStore((state) => state.isLoading)

  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('active')

  useEffect(() => {
    setMode('my')
    fetchOrders().catch(() => {
      // Ignored: page may use persisted/offline data.
    })
  }, [fetchOrders, setMode])

  const filteredOrders = useMemo(() => {
    return myOrders.filter((order) => {
      const searchMatch = `${order.id} ${order.customerName} ${order.address} ${order.customerPhone}`
        .toLowerCase()
        .includes(query.toLowerCase())

      const statusMatch =
        statusFilter === 'all' ||
        (statusFilter === 'active' && (order.status === 'pending' || order.status === 'on_the_way')) ||
        (statusFilter === 'done' && order.status === 'delivered') ||
        (statusFilter === 'problem' &&
          (order.status === 'failed' ||
            order.status === 'canceled_under_21' ||
            order.status === 'canceled_client_rejected'))

      return searchMatch && statusMatch
    })
  }, [myOrders, query, statusFilter])

  const activeCount = useMemo(() => {
    return myOrders.filter((order) => order.status === 'pending' || order.status === 'on_the_way').length
  }, [myOrders])

  const handleResetFilters = (): void => {
    setQuery('')
    setStatusFilter('active')
  }

  return (
    <div className="screen">
      <section className="screen-hero screen-hero--compact">
        <span className="eyebrow">Доставки</span>
        <h1 className="screen-title screen-title--sm">{activeCount ? `${activeCount} активных` : 'Нет активных'}</h1>
        <p className="screen-copy">
          Откройте заказ, позвоните клиенту или постройте маршрут без лишних переходов.
        </p>
      </section>

      <Space direction="vertical" style={{ width: '100%' }}>
        <Input.Search
          className="touch-action"
          placeholder="Имя, адрес, телефон или ID"
          allowClear
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        <Segmented
          className="touch-action"
          block
          options={statusFilterOptions}
          value={statusFilter}
          onChange={(value) => setStatusFilter(value as StatusFilter)}
        />
      </Space>

      {isLoading ? (
        <div className="empty-state">
          <Spin />
          <p className="empty-state__text">Загружаем доставки</p>
        </div>
      ) : filteredOrders.length ? (
        <Space direction="vertical" style={{ width: '100%' }}>
          {filteredOrders.map((order) => (
            <OrderCard key={order.id} order={order} />
          ))}
        </Space>
      ) : (
        <div className="empty-state">
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={null} />
          <h2 className="empty-state__title">Здесь пока пусто</h2>
          <p className="empty-state__text">Проверьте другой фильтр или очистите поиск.</p>
          <Button className="touch-action secondary-action" onClick={handleResetFilters}>
            Сбросить фильтр
          </Button>
        </div>
      )}
    </div>
  )
}
