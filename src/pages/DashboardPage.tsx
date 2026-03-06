import { Card, Col, Row, Statistic, Typography, Button, Input, DatePicker, Space, List, Tag, message } from 'antd'
import { CopyOutlined } from '@ant-design/icons'
import dayjs, { type Dayjs } from 'dayjs'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCourierStore } from '../store/courierStore'
import { useOrdersStore } from '../store/ordersStore'
import { useShiftsStore } from '../store/shiftsStore'

export function DashboardPage() {
  const navigate = useNavigate()
  const deliveredStats = useOrdersStore((state) => state.deliveredStats)
  const deliveredOrders = useOrdersStore((state) =>
    Array.isArray(state.deliveredOrders) ? state.deliveredOrders : [],
  )
  const fetchDeliveredOrders = useOrdersStore((state) => state.fetchDeliveredOrders)
  const isLoading = useOrdersStore((state) => state.isLoading)
  const shifts = useShiftsStore((state) => state.shifts)
  const activeShift = useShiftsStore((state) => state.activeShift)
  const shiftSummaries = useShiftsStore((state) => state.summaries)
  const isShiftLoading = useShiftsStore((state) => state.isLoading)
  const isCalculatingShifts = useShiftsStore((state) => state.isCalculating)
  const shiftsError = useShiftsStore((state) => state.errorMessage)
  const openShift = useShiftsStore((state) => state.openShift)
  const closeShift = useShiftsStore((state) => state.closeShift)
  const loadShifts = useShiftsStore((state) => state.loadShifts)
  const calculateShiftDeliveries = useShiftsStore((state) => state.calculateShiftDeliveries)
  const [searchOrderId, setSearchOrderId] = useState('')
  const profile = useCourierStore((state) => state.profile)
  const [period, setPeriod] = useState<[Dayjs, Dayjs]>([
    dayjs().startOf('month'),
    dayjs().endOf('day'),
  ])

  const workforceId =
    profile?.workforce_employee_id ??
    profile?.keycloak_id ??
    (profile?.employee_id ? String(profile.employee_id) : undefined) ??
    (profile?.courier_id ? String(profile.courier_id) : undefined) ??
    '-'

  const handleCopyWorkforceId = async (): Promise<void> => {
    if (workforceId === '-') {
      return
    }

    try {
      await navigator.clipboard.writeText(workforceId)
      message.success('ID скопирован')
    } catch {
      message.error('Не удалось скопировать ID')
    }
  }

  const stats = useMemo(() => {
    return {
      totalDelivered: deliveredStats.totalDelivered,
      totalEarnings: deliveredStats.totalEarnings,
      avgDeliveryPrice: deliveredStats.avgDeliveryPrice,
      loadedOrders: deliveredOrders.length,
    }
  }, [deliveredOrders.length, deliveredStats.avgDeliveryPrice, deliveredStats.totalDelivered, deliveredStats.totalEarnings])

  useEffect(() => {
    fetchDeliveredOrders(period[0].format('YYYY-MM-DD'), period[1].format('YYYY-MM-DD')).catch(() => {
      message.error('Не удалось загрузить доставленные заказы за период')
    })
  }, [fetchDeliveredOrders, period])

  useEffect(() => {
    loadShifts()
      .then(() => calculateShiftDeliveries())
      .catch(() => {
        message.error('Не удалось загрузить смены')
      })
  }, [calculateShiftDeliveries, loadShifts])

  const handleOpenOrderById = (): void => {
    const normalizedOrderId = searchOrderId.trim()

    if (!normalizedOrderId) {
      message.warning('Введите ID заказа')
      return
    }

    navigate(`/orders/${normalizedOrderId}`)
  }

  const handleOpenMyDeliveries = (): void => {
    navigate('/orders?mode=my')
  }

  const handleApplyPeriod = async (): Promise<void> => {
    try {
      await fetchDeliveredOrders(period[0].format('YYYY-MM-DD'), period[1].format('YYYY-MM-DD'))
    } catch {
      message.error('Не удалось загрузить данные за выбранный период')
    }
  }

  const handleOpenShift = async (): Promise<void> => {
    try {
      await openShift()
      message.success('Смена открыта')
    } catch {
      message.error(useShiftsStore.getState().errorMessage ?? 'Не удалось открыть смену')
    }
  }

  const handleCloseShift = async (): Promise<void> => {
    try {
      await closeShift()
      message.success('Смена закрыта')
    } catch {
      message.error(useShiftsStore.getState().errorMessage ?? 'Не удалось закрыть смену')
    }
  }

  return (
    <>
      <Typography.Title level={4} style={{ margin: 0 }}>
        Доставленные заказы за период
      </Typography.Title>

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

      <Card title="Быстрые действия">
        <Row gutter={[8, 8]}>
          <Col span={12}>
            <Button className="touch-action" block type="primary" onClick={handleOpenMyDeliveries}>
              Открыть заказы
            </Button>
          </Col>
          <Col span={12}>
            <Button className="touch-action" block onClick={() => navigate('/map')}>
              Открыть карту
            </Button>
          </Col>
        </Row>
      </Card>

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
            <Button
              className="touch-action"
              loading={isCalculatingShifts}
              onClick={() => void calculateShiftDeliveries()}
            >
              Пересчитать доставки по сменам
            </Button>
          </Space>

          <Typography.Text>
            Текущая смена:{' '}
            {activeShift ? (
              <Tag color="processing">Активна с {dayjs(activeShift.startedAt).format('DD.MM.YYYY HH:mm')}</Tag>
            ) : (
              <Tag>Нет активной смены</Tag>
            )}
          </Typography.Text>
          <Space size="small" wrap>
            <Typography.Text>Workforce ID: {workforceId}</Typography.Text>
            <Button
              className="touch-action"
              size="small"
              icon={<CopyOutlined />}
              onClick={() => void handleCopyWorkforceId()}
              disabled={workforceId === '-'}
            >
              Копировать
            </Button>
          </Space>

          {shiftsError ? <Typography.Text type="danger">{shiftsError}</Typography.Text> : null}

          <List
            size="small"
            dataSource={shifts}
            locale={{ emptyText: 'Смены не найдены' }}
            renderItem={(shift) => {
              const summary = shiftSummaries[shift.id]
              return (
                <List.Item>
                  <Space direction="vertical" size={0} style={{ width: '100%' }}>
                    <Typography.Text>
                      {dayjs(shift.startedAt).format('DD.MM.YYYY HH:mm')} —{' '}
                      {shift.endedAt ? dayjs(shift.endedAt).format('DD.MM.YYYY HH:mm') : 'по настоящее время'}
                    </Typography.Text>
                    <Typography.Text type="secondary">
                      Статус: {shift.status} • Доставки: {summary?.deliveries ?? 0} • Заработок:{' '}
                      {summary?.earnings ?? 0} ₸ • Средняя доставка: {summary?.avgDeliveryPrice ?? 0} ₸
                    </Typography.Text>
                  </Space>
                </List.Item>
              )
            }}
          />
        </Space>
      </Card>

      <Card title="Период отчёта">
        <Space direction="vertical" style={{ width: '100%' }}>
          <DatePicker.RangePicker
            className="touch-action"
            style={{ width: '100%' }}
            value={period}
            onChange={(value) => {
              if (!value || !value[0] || !value[1]) {
                return
              }

              setPeriod([value[0], value[1]])
            }}
          />
          <Button className="touch-action" type="primary" loading={isLoading} onClick={() => void handleApplyPeriod()}>
            Обновить статистику
          </Button>
        </Space>
      </Card>

      <Row gutter={[12, 12]}>
        <Col xs={12}>
          <Card>
            <Statistic title="Всего доставлено" value={stats.totalDelivered} />
          </Card>
        </Col>
        <Col xs={12}>
          <Card>
            <Statistic title="Общий заработок" value={stats.totalEarnings} suffix="₸" />
          </Card>
        </Col>
        <Col xs={12}>
          <Card>
            <Statistic title="Средняя доставка" value={stats.avgDeliveryPrice} suffix="₸" />
          </Card>
        </Col>
        <Col xs={12}>
          <Card>
            <Statistic title="Загружено заказов" value={stats.loadedOrders} />
          </Card>
        </Col>
      </Row>

    </>
  )
}
