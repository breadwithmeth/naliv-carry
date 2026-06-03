import { Alert, Button, Input, Space, Spin, message } from 'antd'
import dayjs from 'dayjs'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSnackbar } from '../hooks/useSnackbar'
import { useCourierStore } from '../store/courierStore'
import { useOrdersStore } from '../store/ordersStore'
import { useShiftsStore } from '../store/shiftsStore'

const PAGE_OPENED_AT_MS = Date.now()
const finishedOrderStatuses = new Set(['delivered', 'failed', 'canceled_under_21', 'canceled_client_rejected'])

export function DashboardPage() {
  const navigate = useNavigate()
  const orders = useOrdersStore((state) => (Array.isArray(state.orders) ? state.orders : []))
  const fetchOrders = useOrdersStore((state) => state.fetchOrders)
  const activeShift = useShiftsStore((state) => state.activeShift)
  const location = useCourierStore((state) => state.location)
  const loadLocation = useCourierStore((state) => state.loadLocation)
  const isOrdersLoading = useOrdersStore((state) => state.isLoading)
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
    return orders.filter((order) => !finishedOrderStatuses.has(order.status)).length
  }, [orders])

  const activeDeliveryOrders = useMemo(() => {
    return orders.filter((order) => order.status === 'on_the_way' || order.statusCode === 3)
  }, [orders])
  const nextDelivery = activeDeliveryOrders[0]

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
    <div className="screen">
      <section className="screen-hero">
        <span className="eyebrow">Сегодня</span>
        <h1 className="screen-title">{activeShift ? 'Смена открыта' : 'Начните смену'}</h1>
        <p className="screen-copy">
          {activeShift
            ? nextDelivery
              ? `Следующая доставка: ${nextDelivery.customerName}, ${nextDelivery.address}`
              : 'Смена идет. Откройте список доставок и выберите следующий заказ.'
            : 'Откройте смену, чтобы начать принимать и закрывать доставки.'}
        </p>
        <div className="hero-actions">
          {activeShift ? (
            <Button
              block
              type="primary"
              className="touch-action primary-action"
              onClick={() => navigate(nextDelivery ? `/orders/${nextDelivery.id}` : '/orders')}
            >
              {nextDelivery ? 'Открыть доставку' : 'Мои доставки'}
            </Button>
          ) : (
            <Button
              block
              type="primary"
              className="touch-action primary-action"
              loading={isShiftLoading}
              onClick={() => void handleOpenShift()}
            >
              Открыть смену
            </Button>
          )}

          {activeShift ? (
            <Button
              block
              className="touch-action secondary-action"
              loading={isShiftLoading}
              onClick={() => navigate('/shifts/payment-report')}
            >
              Посмотреть оплату смены
            </Button>
          ) : null}
        </div>
      </section>

      {isLocationStale ? (
        <Alert
          type="warning"
          showIcon
          message="Обновите геолокацию"
          description="Последняя точка устарела. Откройте Traccar Client или сохраните геолокацию на экране карты."
        />
      ) : null}

      {shiftsError ? (
        <Alert
          type="error"
          showIcon
          message="Смена не обновилась"
          description={shiftsError}
        />
      ) : null}

      <section className="metric-grid" aria-label="Сводка работы">
        <div className="metric">
          <span className="metric__label">Смена</span>
          <span className="metric__value">{activeShift ? 'Идет' : 'Нет'}</span>
        </div>
        <div className="metric">
          <span className="metric__label">Старт</span>
          <span className="metric__value">
            {activeShift ? dayjs(activeShift.startedAt).format('HH:mm') : '-'}
          </span>
        </div>
        <div className="metric">
          <span className="metric__label">Доставки</span>
          <span className="metric__value">{currentOrdersCount}</span>
        </div>
        <div className="metric">
          <span className="metric__label">В пути</span>
          <span className="metric__value">{activeDeliveryOrders.length}</span>
        </div>
      </section>

      <section className="panel panel--accent">
        <div className="panel__body">
          <div className="panel__header">
            <div>
              <h2 className="panel__title">Быстро открыть заказ</h2>
              <p className="panel__text">Введите номер, если диспетчер назвал ID.</p>
            </div>
          </div>
          <Input.Search
            className="touch-action"
            placeholder="ID заказа"
            value={searchOrderId}
            onChange={(event) => setSearchOrderId(event.target.value)}
            onSearch={handleOpenOrderById}
            enterButton="Открыть"
          />
        </div>
      </section>

      <section className="panel">
        <div className="panel__body">
          <div className="panel__header">
            <div>
              <h2 className="panel__title">Сейчас в доставке</h2>
              <p className="panel__text">Только заказы, которые уже нужно вести клиенту.</p>
            </div>
          </div>

          {isOrdersLoading ? (
            <Spin />
          ) : activeDeliveryOrders.length ? (
            <Space direction="vertical" style={{ width: '100%' }}>
              {activeDeliveryOrders.slice(0, 3).map((order) => (
                <Button
                  key={order.id}
                  block
                  className="touch-action secondary-action"
                  onClick={() => navigate(`/orders/${order.id}`)}
                >
                  #{order.id} · {order.customerName}
                </Button>
              ))}
            </Space>
          ) : (
            <div className="empty-state">
              <h3 className="empty-state__title">Нет активных доставок</h3>
              <p className="empty-state__text">Откройте список доставок, когда появится следующий заказ.</p>
              <Button className="touch-action secondary-action" onClick={handleOpenMyDeliveries}>
                Мои доставки
              </Button>
            </div>
          )}

          {activeShift ? (
            <Button
              block
              className="touch-action danger-action"
              loading={isShiftLoading}
              onClick={() => void handleCloseShift()}
            >
              Закрыть смену
            </Button>
          ) : null}
        </div>
      </section>
    </div>
  )
}
