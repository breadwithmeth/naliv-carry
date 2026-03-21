import { Alert, Card, Col, Row, Statistic, Typography, Button, Input, Space, Tag, List, Empty, Table, message } from 'antd'
import dayjs from 'dayjs'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSnackbar } from '../hooks/useSnackbar'
import { useCourierStore } from '../store/courierStore'
import { useOrdersStore } from '../store/ordersStore'
import { useShiftsStore } from '../store/shiftsStore'

export function DashboardPage() {
  const navigate = useNavigate()
  const orders = useOrdersStore((state) => (Array.isArray(state.orders) ? state.orders : []))
  const fetchOrders = useOrdersStore((state) => state.fetchOrders)
  const activeShift = useShiftsStore((state) => state.activeShift)
  const location = useCourierStore((state) => state.location)
  const loadLocation = useCourierStore((state) => state.loadLocation)
  const shiftSummaries = useShiftsStore((state) => state.summaries)
  const isShiftLoading = useShiftsStore((state) => state.isLoading)
  const shiftsError = useShiftsStore((state) => state.errorMessage)
  const paymentStats = useShiftsStore((state) => state.paymentStats)
  const isPaymentStatsLoading = useShiftsStore((state) => state.isPaymentStatsLoading)
  const openShift = useShiftsStore((state) => state.openShift)
  const closeShift = useShiftsStore((state) => state.closeShift)
  const loadShifts = useShiftsStore((state) => state.loadShifts)
  const calculateShiftDeliveries = useShiftsStore((state) => state.calculateShiftDeliveries)
  const loadPaymentStats = useShiftsStore((state) => state.loadPaymentStats)
  const [searchOrderId, setSearchOrderId] = useState('')
  const { showError } = useSnackbar()

  const lastLocationDate = location?.updated_at ? new Date(location.updated_at) : null
  const locationAgeMs = lastLocationDate ? Date.now() - lastLocationDate.getTime() : null
  const isLocationStale =
    !location || !lastLocationDate || Number.isNaN(lastLocationDate.getTime()) || (locationAgeMs ?? 0) > 6 * 60 * 60 * 1000

  const currentOrdersCount = useMemo(() => {
    return orders.filter((order) => order.status !== 'delivered' && order.status !== 'failed').length
  }, [orders])

  const activeDeliveryOrders = useMemo(() => {
    return orders.filter((order) => order.status === 'on_the_way' || order.statusCode === 3)
  }, [orders])

  const activeShiftSummary = useMemo(() => {
    if (!activeShift) {
      return null
    }

    return shiftSummaries[activeShift.id] ?? null
  }, [activeShift, shiftSummaries])

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
      .then(async () => {
        await calculateShiftDeliveries()
      })
      .catch(() => {
        showError('Не удалось загрузить смены')
      })
  }, [calculateShiftDeliveries, loadShifts, showError])

  const handleLoadPaymentStatsForShift = async (): Promise<void> => {
    if (!activeShift) {
      message.warning('Нет активной смены для загрузки отчета')
      return
    }

    try {
      await loadPaymentStats(activeShift.id)
      message.success('Отчет по типам оплаты загружен')
    } catch {
      showError('Не удалось загрузить статистику по типам оплаты')
    }
  }

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
              <Button type="link" style={{ paddingInline: 0 }} onClick={() => void handleLoadPaymentStatsForShift()}>
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

      <Card title="Отчёт по сменам">
        <Space direction="vertical" style={{ width: '100%' }}>
          <Typography.Text type="secondary">
            {activeShift
              ? `Активная смена с ${dayjs(activeShift.startedAt).format('DD.MM.YYYY HH:mm')}`
              : 'Активной смены нет'}
          </Typography.Text>

          <Row gutter={[12, 12]}>
            <Col xs={12}>
              <Card>
                <Statistic title="Всего доставлено" value={activeShiftSummary?.deliveries ?? 0} loading={isShiftLoading} />
              </Card>
            </Col>
            <Col xs={12}>
              <Card>
                <Statistic title="Общий заработок за смену" value={activeShiftSummary?.earnings ?? 0} suffix="₸" loading={isShiftLoading} />
              </Card>
            </Col>
          </Row>

          <Typography.Text strong>Статистика по типам оплаты</Typography.Text>
          <Typography.Text type="secondary">Нажмите на текущую смену выше, чтобы загрузить отчет.</Typography.Text>
          <Table
            size="small"
            pagination={false}
            loading={isPaymentStatsLoading}
            dataSource={paymentStats?.stats ?? []}
            rowKey={(record) => String(record.paymentTypeId)}
            locale={{ emptyText: 'Нет данных по типам оплаты' }}
            columns={[
              {
                title: 'Тип оплаты',
                dataIndex: 'paymentTypeName',
                key: 'paymentTypeName',
              },
              {
                title: 'Не отменено',
                dataIndex: 'notCanceled',
                key: 'notCanceled',
                width: 120,
              },
              {
                title: 'Отменено',
                dataIndex: 'canceled',
                key: 'canceled',
                width: 120,
              },
            ]}
          />
        </Space>
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
