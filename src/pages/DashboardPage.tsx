import { Alert, Card, Typography, Button, Input, Space, Tag, List, Empty, message } from 'antd'
import dayjs from 'dayjs'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSnackbar } from '../hooks/useSnackbar'
import { useCourierStore } from '../store/courierStore'
import { useOrdersStore } from '../store/ordersStore'
import { useShiftsStore } from '../store/shiftsStore'

const PAGE_OPENED_AT_MS = Date.now()

export function DashboardPage() {
  const navigate = useNavigate()
  const orders = useOrdersStore((state) => (Array.isArray(state.orders) ? state.orders : []))
  const fetchOrders = useOrdersStore((state) => state.fetchOrders)
  const activeShift = useShiftsStore((state) => state.activeShift)
  const location = useCourierStore((state) => state.location)
  const loadLocation = useCourierStore((state) => state.loadLocation)
  const isShiftLoading = useShiftsStore((state) => state.isLoading)
  const shiftsError = useShiftsStore((state) => state.errorMessage)
  const openShift = useShiftsStore((state) => state.openShift)
  const closeShift = useShiftsStore((state) => state.closeShift)
  const loadShifts = useShiftsStore((state) => state.loadShifts)
  const [searchOrderId, setSearchOrderId] = useState('')
  const { showError } = useSnackbar()

  const lastLocationDate = location?.updated_at ? new Date(location.updated_at) : null
  const locationAgeMs = lastLocationDate ? PAGE_OPENED_AT_MS - lastLocationDate.getTime() : null
  const isLocationStale =
    !location || !lastLocationDate || Number.isNaN(lastLocationDate.getTime()) || (locationAgeMs ?? 0) > 6 * 60 * 60 * 1000

  const currentOrdersCount = useMemo(() => {
    return orders.filter((order) => order.status !== 'delivered' && order.status !== 'failed').length
  }, [orders])

  const activeDeliveryOrders = useMemo(() => {
    return orders.filter((order) => order.status === 'on_the_way' || order.statusCode === 3)
  }, [orders])

  useEffect(() => {
    fetchOrders().catch(() => {
      // Optional data for current orders counter.
    })
  }, [fetchOrders])

  useEffect(() => {
    loadLocation().catch(() => {
      // Optional UI data.
    })
  }, [loadLocation])

  useEffect(() => {
    loadShifts()
      .catch(() => {
        showError('Не удалось загрузить смены')
      })
  }, [loadShifts, showError])

  const handleOpenOrderById = (): void => {
    const normalizedOrderId = searchOrderId.trim()

    if (!normalizedOrderId) {
      message.warning('Введите ID заказа')
      return
    }

    navigate(`/orders/${normalizedOrderId}`)
  }

  const handleOpenMyDeliveries = (): void => {
    navigate('/orders')
  }

  const handleOpenShift = async (): Promise<void> => {
    try {
      await openShift()
      message.success('Смена открыта')
    } catch {
      showError(useShiftsStore.getState().errorMessage ?? 'Не удалось открыть смену')
    }
  }

  const handleCloseShift = async (): Promise<void> => {
    try {
      await closeShift()
      message.success('Смена закрыта')
    } catch {
      showError(useShiftsStore.getState().errorMessage ?? 'Не удалось закрыть смену')
    }
  }

  return (
    <>
      <Typography.Title level={4} style={{ margin: 0 }}>
        Главная
      </Typography.Title>

      {isLocationStale ? (
        <Alert
          type="warning"
          showIcon
          message="Геолокация неактуальна"
          description="Последняя геолокация отсутствует или обновлялась более 6 часов назад. Скачайте приложение Traccar Client."
        />
      ) : null}

      <Card title="Смены">
        <Space direction="vertical" style={{ width: '100%' }}>
          <Space wrap>
            <Button
              className="touch-action"
              type="primary"
              loading={isShiftLoading}
              onClick={() => void handleOpenShift()}
              disabled={Boolean(activeShift)}
            >
              Открыть смену
            </Button>
            <Button
              className="touch-action"
              danger
              loading={isShiftLoading}
              onClick={() => void handleCloseShift()}
              disabled={!activeShift}
            >
              Закрыть смену
            </Button>
          </Space>

          <Typography.Text>
            Текущая смена:{' '}
            {activeShift ? (
              <Button type="link" style={{ paddingInline: 0 }} onClick={() => navigate('/shifts/payment-report')}>
                <Tag color="processing">Активна с {dayjs(activeShift.startedAt).format('DD.MM.YYYY HH:mm')}</Tag>
              </Button>
            ) : (
              <Tag>Нет активной смены</Tag>
            )}
          </Typography.Text>

          <Typography.Text>
            Текущие заказы: <Typography.Text strong>{currentOrdersCount}</Typography.Text>
          </Typography.Text>

          {shiftsError ? <Typography.Text type="danger">{shiftsError}</Typography.Text> : null}
        </Space>
      </Card>

      <Card title="Поиск заказа по ID">
        <Input.Search
          className="touch-action"
          placeholder="Введите ID заказа"
          value={searchOrderId}
          onChange={(event) => setSearchOrderId(event.target.value)}
          onSearch={handleOpenOrderById}
          enterButton="Открыть"
        />
      </Card>

      <Card title="Заказы в доставке сейчас">
        {activeDeliveryOrders.length ? (
          <List
            dataSource={activeDeliveryOrders}
            renderItem={(order) => (
              <List.Item
                actions={[
                  <Button
                    key={order.id}
                    type="link"
                    onClick={() => navigate(`/orders/${order.id}`)}
                  >
                    Открыть
                  </Button>,
                ]}
              >
                <List.Item.Meta title={`#${order.id} • ${order.customerName}`} description={order.address} />
              </List.Item>
            )}
          />
        ) : (
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Нет активных доставок" />
        )}
      </Card>

      <Button className="touch-action" block type="primary" onClick={handleOpenMyDeliveries}>
        Мои доставки
      </Button>

    </>
  )
}
