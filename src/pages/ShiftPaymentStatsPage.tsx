import { ArrowLeftOutlined } from '@ant-design/icons'
import { Button, Card, Empty, Space, Table, Tag, Typography } from 'antd'
import dayjs from 'dayjs'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { getPaymentStats } from '../api/courierApi'
import { useSnackbar } from '../hooks/useSnackbar'
import type { PaymentStatsData, PaymentStatsOrder } from '../types/models'

interface GroupedPaymentStat {
  key: string
  paymentTypeName: string
  canceled: number
  notCanceled: number
  canceledAmount: number
  notCanceledAmount: number
  totalAmount: number
  deliveryPriceSum: number
  amountWithoutDelivery: number
  orders: PaymentStatsOrder[]
}

export function ShiftPaymentStatsPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const shiftId = searchParams.get('shiftId') ?? '-'
  const [isLoading, setIsLoading] = useState(() => {
    return shiftId !== '-'
  })
  const [paymentStats, setPaymentStats] = useState<PaymentStatsData | null>(null)
  const { showError } = useSnackbar()

  useEffect(() => {
    if (!shiftId || shiftId === '-') {
      showError('Не передан ID смены для отчета')
      return
    }

    getPaymentStats({ shiftId })
      .then((data) => {
        setPaymentStats(data)
      })
      .catch(() => {
        showError('Не удалось загрузить статистику по типам оплаты')
      })
      .finally(() => {
        setIsLoading(false)
      })
  }, [shiftId, showError])

  const groupedStats = useMemo(() => {
    const grouped = new Map<string, GroupedPaymentStat>()

    const ordersByPaymentType = new Map<string, PaymentStatsOrder[]>()
    for (const order of paymentStats?.orders ?? []) {
      const key = order.paymentTypeName?.trim() || 'APP'
      const collection = ordersByPaymentType.get(key)
      if (collection) {
        collection.push(order)
      } else {
        ordersByPaymentType.set(key, [order])
      }
    }

    for (const item of paymentStats?.stats ?? []) {
      const paymentTypeName = item.paymentTypeName?.trim() || 'APP'
      const current = grouped.get(paymentTypeName)
      const linkedOrders = ordersByPaymentType.get(paymentTypeName) ?? []
      const deliveryPriceSum = linkedOrders.reduce((sum, order) => sum + (order.deliveryPrice ?? 0), 0)
      const amountWithoutDelivery = item.totalAmount - deliveryPriceSum

      if (current) {
        current.canceled += item.canceled
        current.notCanceled += item.notCanceled
        current.canceledAmount += item.canceledAmount
        current.notCanceledAmount += item.notCanceledAmount
        current.totalAmount += item.totalAmount
        current.deliveryPriceSum += deliveryPriceSum
        current.amountWithoutDelivery += amountWithoutDelivery
        current.orders = [...current.orders, ...linkedOrders]
      } else {
        grouped.set(paymentTypeName, {
          key: paymentTypeName,
          paymentTypeName,
          canceled: item.canceled,
          notCanceled: item.notCanceled,
          canceledAmount: item.canceledAmount,
          notCanceledAmount: item.notCanceledAmount,
          totalAmount: item.totalAmount,
          deliveryPriceSum,
          amountWithoutDelivery,
          orders: linkedOrders,
        })
      }
    }

    return Array.from(grouped.values())
  }, [paymentStats?.orders, paymentStats?.stats])

  const totalDeliveryPrice = useMemo(() => {
    return groupedStats.reduce((sum, item) => sum + item.deliveryPriceSum, 0)
  }, [groupedStats])

  const totalWithoutDelivery = useMemo(() => {
    return groupedStats.reduce((sum, item) => sum + item.amountWithoutDelivery, 0)
  }, [groupedStats])

  const titlePeriod = paymentStats?.period
    ? `${dayjs(paymentStats.period.startDate).format('DD.MM.YYYY HH:mm')} - ${dayjs(paymentStats.period.endDate).format('DD.MM.YYYY HH:mm')}`
    : '-'

  return (
    <Space direction="vertical" style={{ width: '100%' }}>
      <Space align="center" style={{ justifyContent: 'space-between', width: '100%' }}>
        <Typography.Title level={4} style={{ margin: 0 }}>
          Статистика по оплатам
        </Typography.Title>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/shifts')}>
          Назад к сменам
        </Button>
      </Space>

      <Card>
        <Space direction="vertical" style={{ width: '100%' }}>
          <Typography.Text>Смена: <Tag>{shiftId}</Tag></Typography.Text>
          <Typography.Text type="secondary">Период: {titlePeriod}</Typography.Text>
        </Space>
      </Card>

      <Card title="Группировка по типу оплаты">
        <Space direction="vertical" style={{ width: '100%' }}>
          <Typography.Text strong>Сумма без доставки: {totalWithoutDelivery.toFixed(2)} ₸</Typography.Text>
          <Typography.Text strong>Сумма по delivery price: {totalDeliveryPrice.toFixed(2)} ₸</Typography.Text>
        </Space>
        <Table
          size="small"
          pagination={false}
          loading={isLoading}
          scroll={{ x: true }}
          dataSource={groupedStats}
          rowKey="key"
          locale={{ emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Нет данных" /> }}
          expandable={{
            expandedRowRender: (record) => (
              <Table
                size="small"
                pagination={false}
                scroll={{ x: true }}
                dataSource={record.orders}
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
                    title: 'Сумма заказа',
                    dataIndex: 'amountTotal',
                    key: 'amountTotal',
                    render: (value: number) => `${value.toFixed(2)} ₸`,
                  },
                  {
                    title: 'Сумма до доставки',
                    dataIndex: 'amountBeforeDelivery',
                    key: 'amountBeforeDelivery',
                    render: (value: number) => `${value.toFixed(2)} ₸`,
                  },
                  {
                    title: 'Delivery price',
                    dataIndex: 'deliveryPrice',
                    key: 'deliveryPrice',
                    render: (value: number) => `${value.toFixed(2)} ₸`,
                  },
                ]}
              />
            ),
            rowExpandable: (record) => record.orders.length > 0,
          }}
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
            {
              title: 'Сумма не отменено',
              dataIndex: 'notCanceledAmount',
              key: 'notCanceledAmount',
              render: (value: number) => `${value.toFixed(2)} ₸`,
            },
            {
              title: 'Сумма отменено',
              dataIndex: 'canceledAmount',
              key: 'canceledAmount',
              render: (value: number) => `${value.toFixed(2)} ₸`,
            },
            {
              title: 'Итого',
              dataIndex: 'totalAmount',
              key: 'totalAmount',
              render: (value: number) => `${value.toFixed(2)} ₸`,
            },
            {
              title: 'Сумма без доставки',
              dataIndex: 'amountWithoutDelivery',
              key: 'amountWithoutDelivery',
              render: (value: number) => `${value.toFixed(2)} ₸`,
            },
            {
              title: 'Delivery price',
              dataIndex: 'deliveryPriceSum',
              key: 'deliveryPriceSum',
              render: (value: number) => `${value.toFixed(2)} ₸`,
            },
          ]}
        />
      </Card>
    </Space>
  )
}
