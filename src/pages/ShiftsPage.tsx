import { Card, Col, Row, Statistic, Typography, Button, Space, Tag, List, message } from 'antd'
import dayjs from 'dayjs'
import { useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSnackbar } from '../hooks/useSnackbar'
import { useShiftsStore } from '../store/shiftsStore'

export function ShiftsPage() {
  const navigate = useNavigate()
  const shifts = useShiftsStore((state) => state.shifts)
  const activeShift = useShiftsStore((state) => state.activeShift)
  const shiftSummaries = useShiftsStore((state) => state.summaries)
  const isShiftLoading = useShiftsStore((state) => state.isLoading)
  const shiftsError = useShiftsStore((state) => state.errorMessage)
  const openShift = useShiftsStore((state) => state.openShift)
  const closeShift = useShiftsStore((state) => state.closeShift)
  const loadShifts = useShiftsStore((state) => state.loadShifts)
  const calculateShiftDeliveries = useShiftsStore((state) => state.calculateShiftDeliveries)
  const { showError } = useSnackbar()

  const activeShiftSummary = useMemo(() => {
    if (!activeShift) {
      return null
    }

    return shiftSummaries[activeShift.id] ?? null
  }, [activeShift, shiftSummaries])

  useEffect(() => {
    loadShifts()
      .then(async () => {
        await calculateShiftDeliveries()
      })
      .catch(() => {
        showError('Не удалось загрузить смены')
      })
  }, [calculateShiftDeliveries, loadShifts, showError])

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

  const handleOpenShiftPaymentStats = (shiftId: string): void => {
    const searchParams = new URLSearchParams({ shiftId })

    navigate(`/shifts/payment-stats?${searchParams.toString()}`)
  }

  return (
    <Space direction="vertical" style={{ width: '100%' }}>
      <Typography.Title level={4} style={{ margin: 0 }}>
        Смены
      </Typography.Title>

      <Card>
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
              <Button
                type="link"
                style={{ paddingInline: 0 }}
                onClick={() => handleOpenShiftPaymentStats(activeShift.id)}
              >
                <Tag color="processing">Активна с {dayjs(activeShift.startedAt).format('DD.MM.YYYY HH:mm')}</Tag>
              </Button>
            ) : (
              <Tag>Нет активной смены</Tag>
            )}
          </Typography.Text>

          {shiftsError ? <Typography.Text type="danger">{shiftsError}</Typography.Text> : null}
        </Space>
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
                <Statistic
                  title="Общий заработок за смену"
                  value={activeShiftSummary?.earnings ?? 0}
                  suffix="₸"
                  loading={isShiftLoading}
                />
              </Card>
            </Col>
          </Row>

          <Typography.Text type="secondary">Нажмите на смену, чтобы открыть подробный отчет по оплатам.</Typography.Text>
        </Space>
      </Card>

      <Card title="Список смен">
        <List
          dataSource={shifts}
          locale={{ emptyText: 'Смены не найдены' }}
          renderItem={(shift) => {
            const summary = shiftSummaries[shift.id]
            return (
              <List.Item
                onClick={() => handleOpenShiftPaymentStats(shift.id)}
                style={{ cursor: 'pointer' }}
              >
                <Space direction="vertical" size={0} style={{ width: '100%' }}>
                  <Typography.Text>
                    {dayjs(shift.startedAt).format('DD.MM.YYYY HH:mm')} -{' '}
                    {shift.endedAt ? dayjs(shift.endedAt).format('DD.MM.YYYY HH:mm') : 'по настоящее время'}
                  </Typography.Text>
                  <Typography.Text type="secondary">
                    Статус: {shift.status} • Доставки: {summary?.deliveries ?? 0} • Заработок: {summary?.earnings ?? 0} ₸
                  </Typography.Text>
                </Space>
              </List.Item>
            )
          }}
        />
      </Card>
    </Space>
  )
}
