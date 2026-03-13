import {
  Card,
  Descriptions,
  Divider,
  List,
  Space,
  Typography,
  Button,
  message,
  Spin,
} from 'antd'
import { EnvironmentOutlined, PhoneOutlined, WhatsAppOutlined } from '@ant-design/icons'
import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { StatusTag } from '../components/common/StatusTag'
import { useOrdersStore } from '../store/ordersStore'
import { build2gisNavigationUrl } from '../utils/navigation'

export function OrderDetailsPage() {
  const { orderId } = useParams()
  const fetchOrderById = useOrdersStore((state) => state.fetchOrderById)
  const takeOrder = useOrdersStore((state) => state.takeOrder)
  const deliverOrder = useOrdersStore((state) => state.deliverOrder)
  const selectedOrder = useOrdersStore((state) => state.selectedOrder)
  const [isBusy, setIsBusy] = useState(true)

  useEffect(() => {
    if (!orderId) {
      setIsBusy(false)
      return
    }

    fetchOrderById(orderId)
      .finally(() => setIsBusy(false))
      .catch(() => {
        setIsBusy(false)
      })
  }, [fetchOrderById, orderId])

  const mapUrl = useMemo(() => {
    if (!selectedOrder) {
      return 'https://2gis.kz/'
    }

    const lat = selectedOrder.deliveryAddressCoordinates?.lat ?? selectedOrder.latitude ?? 0
    const lon = selectedOrder.deliveryAddressCoordinates?.lon ?? selectedOrder.longitude ?? 0
    return build2gisNavigationUrl(lat, lon)
  }, [selectedOrder])

  const whatsappUrl = useMemo(() => {
    if (!selectedOrder?.customerPhone) {
      return 'https://wa.me/'
    }

    const normalizedDigits = selectedOrder.customerPhone.replace(/\D/g, '')
    const addressText = selectedOrder.address?.trim() || selectedOrder.deliveryAddressName?.trim() || 'вашему адресу'
    const text = encodeURIComponent(`Здравствуйте! Это курьер по адресу: ${addressText}.`)
    return `https://wa.me/${normalizedDigits}?text=${text}`
  }, [selectedOrder])

  const onTakeOrder = async () => {
    if (!selectedOrder) {
      return
    }

    try {
      await takeOrder(selectedOrder.id)
      message.success('Заказ взят в доставку')
    } catch {
      message.error('Не удалось взять заказ в доставку')
    }
  }

  const onDeliverOrder = async () => {
    if (!selectedOrder) {
      return
    }

    try {
      await deliverOrder(selectedOrder.id)
      message.success('Доставка подтверждена')
    } catch {
      message.error('Не удалось подтвердить доставку')
    }
  }

  if (isBusy) {
    return <Spin />
  }

  if (!selectedOrder) {
    return <Typography.Text>Заказ не найден</Typography.Text>
  }

  return (
    <Space direction="vertical" style={{ width: '100%' }}>
      <Typography.Title level={4} style={{ margin: 0 }}>
        Заказ №{selectedOrder.id}
      </Typography.Title>

      <Card extra={<StatusTag status={selectedOrder.status} />}>
        <Descriptions column={1} size="small" bordered>
          <Descriptions.Item label="ID заказа">{selectedOrder.id}</Descriptions.Item>
          <Descriptions.Item label="UUID заказа">{selectedOrder.orderUuid ?? '-'}</Descriptions.Item>
          <Descriptions.Item label="Клиент">{selectedOrder.customerName}</Descriptions.Item>
          <Descriptions.Item label="Телефон">{selectedOrder.customerPhone}</Descriptions.Item>
          <Descriptions.Item label="Точка">
            {selectedOrder.businessName ?? '-'}
            {selectedOrder.businessAddress ? `, ${selectedOrder.businessAddress}` : ''}
          </Descriptions.Item>
          <Descriptions.Item label="Название адреса">{selectedOrder.deliveryAddressName ?? '-'}</Descriptions.Item>
          <Descriptions.Item label="Адрес доставки">{selectedOrder.address}</Descriptions.Item>
          <Descriptions.Item label="Оплата">{selectedOrder.paymentTypeName ?? '-'}</Descriptions.Item>
          <Descriptions.Item label="Статус">{selectedOrder.statusName ?? selectedOrder.status}</Descriptions.Item>
          <Descriptions.Item label="Кол-во позиций">{selectedOrder.itemsCount ?? selectedOrder.items?.length ?? '-'}</Descriptions.Item>
          <Descriptions.Item label="Стоимость доставки">{selectedOrder.deliveryPrice ?? '-'}</Descriptions.Item>
          <Descriptions.Item label="Итоговая стоимость">{selectedOrder.totalCost ?? '-'}</Descriptions.Item>
          <Descriptions.Item label="Бонус">{selectedOrder.bonus ?? '-'}</Descriptions.Item>
          <Descriptions.Item label="Создан">{selectedOrder.createdAt ?? '-'}</Descriptions.Item>
          <Descriptions.Item label="Дополнительно">{selectedOrder.extra ?? '-'}</Descriptions.Item>
          <Descriptions.Item label="Комментарий">{selectedOrder.notes ?? '-'}</Descriptions.Item>
        </Descriptions>

        <Divider />

        <Descriptions column={1} size="small" bordered>
          <Descriptions.Item label="Квартира">
            {selectedOrder.deliveryAddressDetails?.apartment || '-'}
          </Descriptions.Item>
          <Descriptions.Item label="Подъезд">
            {selectedOrder.deliveryAddressDetails?.entrance || '-'}
          </Descriptions.Item>
          <Descriptions.Item label="Этаж">{selectedOrder.deliveryAddressDetails?.floor || '-'}</Descriptions.Item>
          <Descriptions.Item label="Комментарий">
            {selectedOrder.deliveryAddressDetails?.comment || '-'}
          </Descriptions.Item>
        </Descriptions>
      </Card>

      <Card title="Действия">
        <Space wrap>
          <Button
            className="touch-action"
            href={`tel:${selectedOrder.customerPhone}`}
            icon={<PhoneOutlined />}
          >
            Позвонить клиенту
          </Button>
          <Button className="touch-action" href={mapUrl} target="_blank" icon={<EnvironmentOutlined />}>
            Открыть навигацию
          </Button>
          <Button className="touch-action" href={whatsappUrl} target="_blank" icon={<WhatsAppOutlined />}>
            Написать в WhatsApp
          </Button>
        </Space>
      </Card>

      <Card title="История статусов">
        <List
          dataSource={selectedOrder.statusHistory ?? []}
          locale={{ emptyText: 'Нет истории статусов' }}
          renderItem={(item) => (
            <List.Item>
              <Space direction="vertical" size={0}>
                <Typography.Text>{item.statusName}</Typography.Text>
                <Typography.Text type="secondary">{item.timestamp ?? '-'}</Typography.Text>
              </Space>
            </List.Item>
          )}
        />
      </Card>

      <Card title="Позиции заказа">
        <List
          dataSource={selectedOrder.items ?? []}
          locale={{ emptyText: 'Нет позиций' }}
          renderItem={(item) => (
            <List.Item>
              <Typography.Text strong>
                {item.name ?? '-'} x {item.amount ?? 1}
              </Typography.Text>
            </List.Item>
          )}
        />
      </Card>

      <Card title="Сводка по стоимости">
        <Descriptions column={1} size="small" bordered>
          <Descriptions.Item label="Сумма товаров">{selectedOrder.costSummary?.itemsTotal ?? '-'}</Descriptions.Item>
          <Descriptions.Item label="Стоимость доставки">
            {selectedOrder.costSummary?.deliveryPrice ?? '-'}
          </Descriptions.Item>
          <Descriptions.Item label="Сервисный сбор">{selectedOrder.costSummary?.serviceFee ?? '-'}</Descriptions.Item>
          <Descriptions.Item label="Списано бонусов">{selectedOrder.costSummary?.bonusUsed ?? '-'}</Descriptions.Item>
          <Descriptions.Item label="Промежуточный итог">{selectedOrder.costSummary?.subtotal ?? '-'}</Descriptions.Item>
          <Descriptions.Item label="Итого">{selectedOrder.costSummary?.totalSum ?? '-'}</Descriptions.Item>
        </Descriptions>
      </Card>

      <Card title="Действия доставки">
        <Space wrap>
          <Button
            className="touch-action"
            type="primary"
            onClick={onTakeOrder}
            disabled={selectedOrder.statusCode === 3 || selectedOrder.status === 'on_the_way'}
          >
            Взять в доставку
          </Button>
          <Button
            className="touch-action"
            onClick={onDeliverOrder}
            disabled={
              !(selectedOrder.statusCode === 3 || selectedOrder.status === 'on_the_way') ||
              selectedOrder.statusCode === 4 ||
              selectedOrder.status === 'delivered'
            }
          >
            Выдать заказ
          </Button>
        </Space>
      </Card>
    </Space>
  )
}
