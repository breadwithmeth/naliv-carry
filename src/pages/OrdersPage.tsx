import { Button, DatePicker, Input, Segmented, Select, Space, Typography, message } from 'antd'
import dayjs from 'dayjs'
import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { OrderCard } from '../features/orders/OrderCard'
import { useCourierStore } from '../store/courierStore'
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
  const [searchParams] = useSearchParams()
  const mode = useOrdersStore((state) => state.mode)
  const setMode = useOrdersStore((state) => state.setMode)
  const myOrders = useOrdersStore((state) => (Array.isArray(state.orders) ? state.orders : []))
  const availableOrders = useOrdersStore((state) =>
    Array.isArray(state.availableOrders) ? state.availableOrders : [],
  )
  const deliveredOrders = useOrdersStore((state) =>
    Array.isArray(state.deliveredOrders) ? state.deliveredOrders : [],
  )
  const deliveredStats = useOrdersStore((state) => state.deliveredStats)
  const fetchOrders = useOrdersStore((state) => state.fetchOrders)
  const fetchAvailableOrders = useOrdersStore((state) => state.fetchAvailableOrders)
  const fetchDeliveredOrders = useOrdersStore((state) => state.fetchDeliveredOrders)
  const takeOrder = useOrdersStore((state) => state.takeOrder)
  const cities = useCourierStore((state) => state.cities)
  const loadCities = useCourierStore((state) => state.loadCities)
  const selectedCityId = useCourierStore((state) => state.selectedCityId)
  const setSelectedCityId = useCourierStore((state) => state.setSelectedCityId)

  const [query, setQuery] = useState('')
  const [status, setStatus] = useState<'all' | DeliveryStatus>('all')
  const [startDate, setStartDate] = useState(dayjs().startOf('day'))
  const [endDate, setEndDate] = useState(dayjs().endOf('day'))

  useEffect(() => {
    fetchOrders().catch(() => {
      // Ignored: page may use persisted/offline data.
    })
    loadCities().catch(() => {
      // Optional data for filters.
    })
  }, [fetchOrders, loadCities])

  useEffect(() => {
    if (searchParams.get('mode') !== 'my') {
      return
    }

    setMode('my')
    fetchOrders().catch(() => {
      // Fail silently, page may still render persisted data.
    })
  }, [fetchOrders, searchParams, setMode])

  const sourceOrders = useMemo(() => {
    if (mode === 'available') {
      return availableOrders
    }
    if (mode === 'delivered') {
      return deliveredOrders
    }

    return myOrders
  }, [availableOrders, deliveredOrders, mode, myOrders])

  const filteredOrders = useMemo(() => {
    return sourceOrders.filter((order) => {
      const searchMatch = `${order.customerName} ${order.address} ${order.customerPhone}`
        .toLowerCase()
        .includes(query.toLowerCase())

      const statusMatch = status === 'all' || order.status === status

      return searchMatch && statusMatch
    })
  }, [query, sourceOrders, status])

  const applyModeQuery = async () => {
    if (mode === 'available') {
      if (!selectedCityId) {
        return
      }
      await fetchAvailableOrders(selectedCityId)
      return
    }

    if (mode === 'delivered') {
      await fetchDeliveredOrders(startDate.format('YYYY-MM-DD'), endDate.format('YYYY-MM-DD'))
      return
    }

    await fetchOrders()
  }

  const handleModeChange = async (nextMode: string | number) => {
    const normalizedMode = nextMode as 'my' | 'available' | 'delivered'
    setMode(normalizedMode)

    if (normalizedMode === 'available' && selectedCityId) {
      await fetchAvailableOrders(selectedCityId)
      return
    }

    if (normalizedMode === 'delivered') {
      await fetchDeliveredOrders(startDate.format('YYYY-MM-DD'), endDate.format('YYYY-MM-DD'))
      return
    }

    await fetchOrders()
  }

  const handleTakeOrder = async (orderId: string) => {
    try {
      await takeOrder(orderId)
      message.success('Заказ взят в доставку')
    } catch {
      message.error('Не удалось взять заказ')
    }
  }

  return (
    <>
      <Typography.Title level={4} style={{ margin: 0 }}>
        Заказы курьера
      </Typography.Title>
      <Space direction="vertical" style={{ width: '100%' }}>
        <Segmented
          value={mode}
          options={[
            { value: 'my', label: 'Мои доставки' },
            { value: 'available', label: 'Доступные' },
            { value: 'delivered', label: 'Доставленные за период' },
          ]}
          block
          onChange={handleModeChange}
        />

        {mode === 'available' && (
          <Select
            className="touch-action"
            value={selectedCityId ?? undefined}
            placeholder="Выберите город"
            options={cities.map((city) => ({ value: city.city_id, label: city.name }))}
            onChange={(value) => setSelectedCityId(value)}
          />
        )}

        {mode === 'delivered' && (
          <Space.Compact style={{ width: '100%' }}>
            <DatePicker
              className="touch-action"
              value={startDate}
              style={{ width: '50%' }}
              onChange={(value) => setStartDate(value ?? dayjs().startOf('day'))}
            />
            <DatePicker
              className="touch-action"
              value={endDate}
              style={{ width: '50%' }}
              onChange={(value) => setEndDate(value ?? dayjs().endOf('day'))}
            />
          </Space.Compact>
        )}

        <Button type="primary" className="touch-action" onClick={() => void applyModeQuery()}>
          Применить
        </Button>

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

      {mode === 'delivered' && (
        <Space direction="vertical" style={{ width: '100%' }}>
          <Typography.Text>
            Доставлено: {deliveredStats.totalDelivered} • Заработок: {deliveredStats.totalEarnings} • Средний чек:{' '}
            {deliveredStats.avgDeliveryPrice}
          </Typography.Text>
        </Space>
      )}

      <Space direction="vertical" style={{ width: '100%' }}>
        {filteredOrders.map((order) => (
          <OrderCard
            key={order.id}
            order={order}
            onTakeOrder={mode === 'available' ? handleTakeOrder : undefined}
          />
        ))}
      </Space>
    </>
  )
}
