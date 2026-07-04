import { Button, Card, Space, Typography } from 'antd'
import { PhoneOutlined, EnvironmentOutlined } from '@ant-design/icons'
import { Link } from 'react-router-dom'
import { StatusTag } from '../../components/common/StatusTag'
import type { Order } from '../../types/models'
import { build2gisNavigationUrl } from '../../utils/navigation'
import { buildPhoneCallUrl } from '../../utils/phone'

interface Props {
  order: Order
  onTakeOrder?: (orderId: string) => void
}

export function OrderCard({ order, onTakeOrder }: Props) {
  const lat = order.deliveryAddressCoordinates?.lat ?? order.latitude ?? 0
  const lon = order.deliveryAddressCoordinates?.lon ?? order.longitude ?? 0
  const point = order.businessName
    ? `${order.businessName}${order.businessAddress ? `, ${order.businessAddress}` : ''}`
    : undefined
  const callUrl = buildPhoneCallUrl(order.customerPhone)

  return (
    <Card
      className="order-card"
    >
      <div className="order-card__top">
        <div>
          <h2 className="order-card__title">{order.customerName}</h2>
          <Typography.Text className="eyebrow">#{order.id}</Typography.Text>
        </div>
        <StatusTag status={order.status} />
      </div>

      <p className="order-card__address">{order.address}</p>
      {point ? <p className="order-card__address">Точка: {point}</p> : null}

      <Space wrap>
        <Link to={`/orders/${order.id}`}>
          <Button className="touch-action" type="primary">
            Открыть
          </Button>
        </Link>
        <Button
          className="touch-action secondary-action"
          href={callUrl}
          disabled={!callUrl}
          icon={<PhoneOutlined />}
        >
          Звонок
        </Button>
        <Button
          className="touch-action secondary-action"
          href={build2gisNavigationUrl(lat, lon)}
          target="_blank"
          icon={<EnvironmentOutlined />}
        >
          Маршрут
        </Button>
        {onTakeOrder && (
          <Button className="touch-action secondary-action" onClick={() => onTakeOrder(order.id)}>
            Взять в доставку
          </Button>
        )}
      </Space>
    </Card>
  )
}
