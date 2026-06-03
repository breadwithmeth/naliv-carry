import { ArrowLeftOutlined, ReloadOutlined } from '@ant-design/icons'
import { AxiosError } from 'axios'
import { Button, Card, Col, Empty, Row, Space, Statistic, Table, Tag, Typography } from 'antd'
import dayjs from 'dayjs'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { getShiftPaymentReport } from '../api/courierApi'
import { useSnackbar } from '../hooks/useSnackbar'
import type { ShiftPaymentReportData, ShiftPaymentReportShift } from '../types/models'

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

export function ShiftPaymentStatsPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const shiftId = searchParams.get('shiftId')?.trim() || undefined
  const [isLoading, setIsLoading] = useState(true)
  const [report, setReport] = useState<ShiftPaymentReportData | null>(null)
  const { showError } = useSnackbar()

  const loadReport = useCallback(async (): Promise<void> => {
    setIsLoading(true)

    try {
      const data = await getShiftPaymentReport({ shiftId })
      setReport(data)
    } catch (error) {
      setReport(null)
      showError(mapReportError(error))
    } finally {
      setIsLoading(false)
    }
  }, [shiftId, showError])

  useEffect(() => {
    void loadReport()
  }, [loadReport])

  const title = shiftId ? 'Оплата смены' : 'Оплата сейчас'
  const generatedAt = report?.generatedAt ? dayjs(report.generatedAt).format('DD.MM.YYYY HH:mm') : '-'
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
            onClick={() => void loadReport()}
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

  const period = `${dayjs(shiftReport.period.startDate).format('DD.MM.YYYY HH:mm')} - ${dayjs(
    shiftReport.period.endDate,
  ).format('DD.MM.YYYY HH:mm')}`
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
