import { Button, Empty, List, Spin, message } from 'antd'
import dayjs from 'dayjs'
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSnackbar } from '../hooks/useSnackbar'
import { useShiftsStore } from '../store/shiftsStore'

export function ShiftsPage() {
  const navigate = useNavigate()
  const shifts = useShiftsStore((state) => state.shifts)
  const activeShift = useShiftsStore((state) => state.activeShift)
  const shiftSummaries = useShiftsStore((state) => state.summaries)
  const isShiftLoading = useShiftsStore((state) => state.isLoading)
  const isCalculating = useShiftsStore((state) => state.isCalculating)
  const shiftsError = useShiftsStore((state) => state.errorMessage)
  const openShift = useShiftsStore((state) => state.openShift)
  const closeShift = useShiftsStore((state) => state.closeShift)
  const loadShifts = useShiftsStore((state) => state.loadShifts)
  const calculateShiftDeliveries = useShiftsStore((state) => state.calculateShiftDeliveries)
  const { showError } = useSnackbar()

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

    navigate(`/shifts/payment-report?${searchParams.toString()}`)
  }

  return (
    <div className="screen">
      <section className="screen-hero screen-hero--compact">
        <span className="eyebrow">Смена</span>
        <h1 className="screen-title screen-title--sm">{activeShift ? 'Вы на линии' : 'Смена закрыта'}</h1>
        <p className="screen-copy">
          {activeShift
            ? `Начали в ${dayjs(activeShift.startedAt).format('HH:mm')}. Закройте смену в конце работы.`
            : 'Откройте смену перед первой доставкой.'}
        </p>
        <div className="hero-actions">
          {activeShift ? (
            <Button
              block
              type="primary"
              className="touch-action primary-action"
              loading={isShiftLoading}
              onClick={() => void handleCloseShift()}
            >
              Закрыть смену
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
              onClick={() => handleOpenShiftPaymentStats(activeShift.id)}
            >
              Оплата текущей смены
            </Button>
          ) : null}
        </div>
      </section>

      <section className="metric-grid" aria-label="Сводка смен">
        <div className="metric">
          <span className="metric__label">Всего смен</span>
          <span className="metric__value">{shifts.length}</span>
        </div>
        <div className="metric">
          <span className="metric__label">Статус</span>
          <span className="metric__value">{activeShift ? 'Идет' : 'Нет'}</span>
        </div>
      </section>

      {shiftsError ? (
        <section className="panel">
          <div className="panel__body">
            <h2 className="panel__title">Не удалось обновить смены</h2>
            <p className="panel__text">{shiftsError}</p>
          </div>
        </section>
      ) : null}

      <section className="panel">
        <div className="panel__body">
          <div className="panel__header">
            <div>
              <h2 className="panel__title">История смен</h2>
              <p className="panel__text">Нажмите на смену, чтобы открыть оплату и доставки.</p>
            </div>
            {isCalculating ? <Spin size="small" /> : null}
          </div>

          <List
            dataSource={shifts}
            locale={{ emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Смен пока нет" /> }}
            renderItem={(shift) => {
              const summary = shiftSummaries[shift.id]
              return (
                <List.Item
                  onClick={() => handleOpenShiftPaymentStats(shift.id)}
                  style={{ cursor: 'pointer' }}
                >
                  <div style={{ width: '100%' }}>
                    <strong>
                      {dayjs(shift.startedAt).format('DD.MM HH:mm')} -{' '}
                      {shift.endedAt ? dayjs(shift.endedAt).format('HH:mm') : 'сейчас'}
                    </strong>
                    <p className="panel__text">
                      {shift.status === 'ACTIVE' ? 'Активная' : 'Закрыта'} · {summary?.deliveries ?? 0} доставок ·{' '}
                      {summary?.earnings ?? 0} ₸
                    </p>
                  </div>
                </List.Item>
              )
            }}
          />
        </div>
      </section>
    </div>
  )
}
