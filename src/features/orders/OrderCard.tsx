import { Button, Card, Space, Typography } from 'antd'
import { PhoneOutlined, EnvironmentOutlined } from '@ant-design/icons'
import { Link } from 'react-router-dom'
import { StatusTag } from '../../components/common/StatusTag'
import type { Order } from '../../types/models'
import { build2gisNavigationUrl } from '../../utils/navigation'

interface Props {
  order: Order
  onTakeOrder?: (orderId: string) => void
}

export function OrderCard({ order, onTakeOrder }: Props) {
  return (
    <Card
      title={order.customerName}
      extra={<StatusTag status={order.status} />}
      styles={{ body: { display: 'flex', flexDirection: 'column', gap: 12 } }}
    >
      {(order.businessName || order.businessAddress) && (
        <Typography.Text type="secondary">
          {`Точка: ${order.businessName ?? '-'}${order.businessAddress ? `, ${order.businessAddress}` : ''}`}
        </Typography.Text>
      )}
      <Typography.Text type="secondary">{order.address}</Typography.Text>
      <Space wrap>
        <Button className="touch-action" href={`tel:${order.customerPhone}`} icon={<PhoneOutlined />}>
          Позвонить
        </Button>
        <Button
          className="touch-action"
          href={build2gisNavigationUrl(order.latitude, order.longitude)}
          target="_blank"
          icon={<EnvironmentOutlined />}
        >
          Навигация
        </Button>
        <Link to={`/orders/${order.id}`}>
          <Button className="touch-action" type="primary">
            Подробнее
          </Button>
        </Link>
        {onTakeOrder && (
          <Button className="touch-action" onClick={() => onTakeOrder(order.id)}>
            Взять
          </Button>
        )}
      </Space>
    </Card>
  )
}
