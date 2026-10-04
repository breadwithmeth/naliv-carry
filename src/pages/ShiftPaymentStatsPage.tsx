import { ArrowLeftOutlined, ReloadOutlined } from '@ant-design/icons'
import { AxiosError } from 'axios'
import { Button, Card, Col, Empty, Row, Space, Statistic, Table, Tag, Typography } from 'antd'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { getShiftPaymentReport } from '../api/courierApi'
import { getDeliveredOrders } from '../api/ordersApi'
import { useSnackbar } from '../hooks/useSnackbar'
import type { Order, ShiftPaymentReportData, ShiftPaymentReportShift } from '../types/models'
import { formatLocalDateTime } from '../utils/dateTime'

function formatMoney(value: number): string {
  return `${value.toFixed(2)} ₸`
}

function mapReportError(error: unknown): string {
  if (error instanceof AxiosError) {
    if (error.response?.status === 403) {
      return 'Нет активной смены для отчета'
    }

    if (error.response?.status === 404) {
      return 'Смена не найдена'
    }

    if (error.response?.status === 401) {
      return 'Необходимо снова войти в учетную запись'
    }
  }

  return 'Не удалось загрузить отчет по оплатам'
}

function mapDeliveredError(error: unknown): string {
  if (error instanceof AxiosError) {
    if (error.response?.status === 404) {
      return 'Смена не найдена для указанного shift_id'
    }

    if (error.response?.status === 401) {
      return 'Необходимо снова войти в учетную запись'
    }
  }

  return 'Не удалось загрузить оплаченные заказы смены'
}

export function ShiftPaymentStatsPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const shiftId = searchParams.get('shiftId')?.trim() || undefined
  const [isLoading, setIsLoading] = useState(true)
  const [report, setReport] = useState<ShiftPaymentReportData | null>(null)
  const [deliveredOrders, setDeliveredOrders] = useState<Order[]>([])
  const [deliveredStats, setDeliveredStats] = useState<{
    total_delivered: number
    total_credited_cancellations?: number
    total_earnings: number
    avg_delivery_price: number
  } | null>(null)
  const { showError } = useSnackbar()

  const numericShiftId = useMemo(() => {
    const value = Number(shiftId)
    return Number.isInteger(value) && value > 0 ? value : undefined
  }, [shiftId])

  const loadReport = useCallback(async (): Promise<void> => {
    setIsLoading(true)

    try {
      const data = await getShiftPaymentReport({ shiftId })
      setReport(data)
    } catch (error) {
      setReport(null)
      showError(mapReportError(error), { error })
    } finally {
      setIsLoading(false)
    }
  }, [shiftId, showError])

  const loadDeliveredOrders = useCallback(async (): Promise<void> => {
    if (numericShiftId === undefined) {
      setDeliveredOrders([])
      setDeliveredStats(null)
      return
    }

    try {
      const data = await getDeliveredOrders({ shiftId: numericShiftId, limit: 100 })
      setDeliveredOrders(data.orders)
      setDeliveredStats(data.statistics)
    } catch (error) {
      setDeliveredOrders([])
      setDeliveredStats(null)
      showError(mapDeliveredError(error), { error })
    }
  }, [numericShiftId, showError])

  useEffect(() => {
    void loadReport()
    void loadDeliveredOrders()
  }, [loadReport, loadDeliveredOrders])

  const title = shiftId ? 'Оплата смены' : 'Оплата сейчас'
  const generatedAt = formatLocalDateTime(report?.generatedAt)
  const totalDeliveryEarnings = useMemo(() => {
    return (
      report?.shifts.reduce((sum, shiftReport) => {
        return sum + shiftReport.orders.reduce((ordersSum, order) => ordersSum + order.deliveryCost, 0)
      }, 0) ?? 0
    )
  }, [report?.shifts])

  return (
    <div className="screen">
      <section className="screen-hero screen-hero--compact">
        <span className="eyebrow">Отчет</span>
        <h1 className="screen-title screen-title--sm">{title}</h1>
        <p className="screen-copy">
          {shiftId ? `Смена ${shiftId}` : 'Текущая активная смена'} · сформировано {generatedAt}
        </p>
        <Space wrap>
          <Button
            className="touch-action secondary-action"
            icon={<ReloadOutlined />}
            loading={isLoading}
            onClick={() => {
              void loadReport()
              void loadDeliveredOrders()
            }}
          >
            Обновить
          </Button>
          <Button className="touch-action secondary-action" icon={<ArrowLeftOutlined />} onClick={() => navigate('/shifts')}>
            Смены
          </Button>
        </Space>
      </section>

      <section className="metric-grid" aria-label="Итоги оплат">
        <div className="metric">
          <span className="metric__label">Заказов</span>
          <span className="metric__value">{report?.summary.totalOrders ?? 0}</span>
        </div>
        <div className="metric">
          <span className="metric__label">Сумма</span>
          <span className="metric__value">{report?.summary.totalAmount ?? 0} ₸</span>
        </div>
        <div className="metric">
          <span className="metric__label">Заработок</span>
          <span className="metric__value">{totalDeliveryEarnings} ₸</span>
        </div>
        <div className="metric">
          <span className="metric__label">Смен</span>
          <span className="metric__value">{report?.summary.totalShifts ?? 0}</span>
        </div>
      </section>

      {report?.shifts.map((shiftReport) => (
        <ShiftPaymentReportCard key={shiftReport.shift.id} shiftReport={shiftReport} isLoading={isLoading} />
      ))}

      {numericShiftId !== undefined ? (
        <Card title={`Оплаченные заказы смены ${numericShiftId}`}>
          <Space direction="vertical" style={{ width: '100%' }}>
            <Row gutter={[12, 12]}>
              <Col xs={12} md={6}>
                <Statistic
                  title="Доставлено"
                  value={deliveredStats?.total_delivered ?? 0}
                  loading={isLoading}
                />
              </Col>
              <Col xs={12} md={6}>
                <Statistic
                  title="Засчитанные отмены"
                  value={deliveredStats?.total_credited_cancellations ?? 0}
                  loading={isLoading}
                />
              </Col>
              <Col xs={12} md={6}>
                <Statistic
                  title="Заработок"
                  value={deliveredStats?.total_earnings ?? 0}
                  suffix="₸"
                  loading={isLoading}
                />
              </Col>
              <Col xs={12} md={6}>
                <Statistic
                  title="Средний чек"
                  value={deliveredStats?.avg_delivery_price ?? 0}
                  suffix="₸"
                  loading={isLoading}
                />
              </Col>
            </Row>

            <Table
              size="small"
              pagination={false}
              loading={isLoading}
              scroll={{ x: true }}
              dataSource={deliveredOrders}
              rowKey={(order) => order.id}
              locale={{
                emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Нет оплаченных заказов за смену" />,
              }}
              columns={[
                {
                  title: 'Заказ',
                  dataIndex: 'id',
                  key: 'id',
                  render: (value: string) => `#${value}`,
                },
                {
                  title: 'Клиент',
                  dataIndex: 'customerName',
                  key: 'customerName',
                },
                {
                  title: 'Адрес',
                  dataIndex: 'address',
                  key: 'address',
                },
                {
                  title: 'Статус',
                  dataIndex: 'statusName',
                  key: 'statusName',
                  render: (value: string) => value || 'Доставлен',
                },
                {
                  title: 'Доставка',
                  dataIndex: 'deliveryPrice',
                  key: 'deliveryPrice',
                  render: (value: number) => formatMoney(value ?? 0),
                },
                {
                  title: 'Дата доставки',
                  dataIndex: 'createdAt',
                  key: 'createdAt',
                  render: (value: string | null) => (value ? formatLocalDateTime(value) : '-'),
                },
              ]}
            />
          </Space>
        </Card>
      ) : null}

      {!isLoading && !report?.shifts.length ? (
        <Card>
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Нет данных по сменам" />
        </Card>
      ) : null}
    </div>
  )
}

interface ShiftPaymentReportCardProps {
  shiftReport: ShiftPaymentReportShift
  isLoading: boolean
}

type PaymentTypeReportRow = ShiftPaymentReportShift['paymentTypes'][number] & {
  amountWithDeliveryTotal: number
  amountWithoutDeliveryTotal: number
  deliveryCostTotal: number
  deliveryServiceFeeTotal: number
  ordersAmountTotal: number
}

function ShiftPaymentReportCard({ shiftReport, isLoading }: ShiftPaymentReportCardProps) {
  const ordersByPaymentType = useMemo(() => {
    const grouped = new Map<string, ShiftPaymentReportShift['orders']>()

    for (const order of shiftReport.orders) {
      const key = order.paymentTypeName?.trim() || 'APP'
      grouped.set(key, [...(grouped.get(key) ?? []), order])
    }

    return grouped
  }, [shiftReport.orders])

  const paymentTypeRows = useMemo<PaymentTypeReportRow[]>(() => {
    return shiftReport.paymentTypes.map((paymentType) => {
      const paymentTypeName = paymentType.paymentTypeName?.trim() || 'APP'
      const orders = ordersByPaymentType.get(paymentTypeName) ?? []

      return {
        ...paymentType,
        ordersAmountTotal: orders.reduce((sum, order) => sum + order.amountTotal, 0),
        amountWithDeliveryTotal: orders.reduce((sum, order) => sum + order.amountTotal, 0),
        amountWithoutDeliveryTotal: orders.reduce(
          (sum, order) => sum + Math.max(order.amountTotal - order.deliveryCost, 0),
          0,
        ),
        deliveryCostTotal: orders.reduce((sum, order) => sum + order.deliveryCost, 0),
        deliveryServiceFeeTotal: orders.reduce((sum, order) => sum + order.deliveryServiceFee, 0),
      }
    })
  }, [ordersByPaymentType, shiftReport.paymentTypes])

  const period = `${formatLocalDateTime(shiftReport.period.startDate)} - ${formatLocalDateTime(
    shiftReport.period.endDate,
  )}`
  const shiftDeliveryEarnings = useMemo(() => {
    return shiftReport.orders.reduce((sum, order) => sum + order.deliveryCost, 0)
  }, [shiftReport.orders])

  return (
    <Card
      title={`Смена ${shiftReport.shift.id}`}
      extra={<Tag color={shiftReport.shift.isClosed ? 'default' : 'processing'}>{shiftReport.shift.status}</Tag>}
    >
      <Space direction="vertical" style={{ width: '100%' }}>
        <Typography.Text type="secondary">Период: {period}</Typography.Text>
        <Row gutter={[12, 12]}>
          <Col xs={12}>
            <Statistic title="Заказов" value={shiftReport.totals.ordersCount} loading={isLoading} />
          </Col>
          <Col xs={12}>
            <Statistic title="Сумма" value={shiftReport.totals.totalAmount} suffix="₸" loading={isLoading} />
          </Col>
          <Col xs={24}>
            <Statistic title="Заработок с доставки" value={shiftDeliveryEarnings} suffix="₸" loading={isLoading} />
          </Col>
        </Row>

        <Table
          size="small"
          pagination={false}
          loading={isLoading}
          scroll={{ x: true }}
          dataSource={paymentTypeRows}
          rowKey={(record) => `${record.paymentTypeId}-${record.paymentTypeName ?? 'APP'}`}
          locale={{ emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Нет типов оплаты" /> }}
          expandable={{
            expandedRowRender: (record) => {
              const paymentTypeName = record.paymentTypeName?.trim() || 'APP'
              const orders = ordersByPaymentType.get(paymentTypeName) ?? []

              return (
                <Table
                  size="small"
                  pagination={false}
                  scroll={{ x: true }}
                  dataSource={orders}
                  rowKey={(order) => String(order.orderId)}
                  locale={{ emptyText: 'Нет заказов для этого типа оплаты' }}
                  columns={[
                    {
                      title: 'Заказ',
                      dataIndex: 'orderId',
                      key: 'orderId',
                      render: (value: number) => `#${value}`,
                    },
                    {
                      title: 'Статус',
                      dataIndex: 'isCanceled',
                      key: 'isCanceled',
                      render: (value: boolean) => (value ? 'Отменен' : 'Не отменен'),
                    },
                    {
                      title: 'Сумма',
                      dataIndex: 'amountTotal',
                      key: 'amountTotal',
                      render: (value: number) => formatMoney(value),
                    },
                    {
                      title: 'Доставка',
                      dataIndex: 'deliveryCost',
                      key: 'deliveryCost',
                      render: (value: number) => formatMoney(value),
                    },
                    {
                      title: 'Сервис доставки',
                      dataIndex: 'deliveryServiceFee',
                      key: 'deliveryServiceFee',
                      render: (value: number) => formatMoney(value),
                    },
                  ]}
                />
              )
            },
            rowExpandable: (record) => {
              const paymentTypeName = record.paymentTypeName?.trim() || 'APP'
              return (ordersByPaymentType.get(paymentTypeName) ?? []).length > 0
            },
          }}
          columns={[
            {
              title: 'Тип оплаты',
              dataIndex: 'paymentTypeName',
              key: 'paymentTypeName',
              render: (value: string | null) => value?.trim() || 'APP',
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
            {
              title: 'Сумма не отменено',
              dataIndex: 'notCanceledAmount',
              key: 'notCanceledAmount',
              render: (value: number) => formatMoney(value),
            },
            {
              title: 'Сумма отменено',
              dataIndex: 'canceledAmount',
              key: 'canceledAmount',
              render: (value: number) => formatMoney(value),
            },
            {
              title: 'Сумма с доставкой',
              dataIndex: 'amountWithDeliveryTotal',
              key: 'amountWithDeliveryTotal',
              render: (value: number, record) => formatMoney(value || record.totalAmount || record.ordersAmountTotal),
            },
            {
              title: 'Сумма без доставки',
              dataIndex: 'amountWithoutDeliveryTotal',
              key: 'amountWithoutDeliveryTotal',
              render: (value: number) => formatMoney(value),
            },
            {
              title: 'Заработок',
              dataIndex: 'deliveryCostTotal',
              key: 'deliveryCostTotal',
              render: (value: number) => formatMoney(value),
            },
            {
              title: 'Сервисный сбор',
              dataIndex: 'deliveryServiceFeeTotal',
              key: 'deliveryServiceFeeTotal',
              render: (value: number) => formatMoney(value),
            },
          ]}
        />
      </Space>
    </Card>
  )
}
