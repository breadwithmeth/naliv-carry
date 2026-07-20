import {
  Alert,
  Button,
  Collapse,
  Empty,
  Input,
  List,
  message,
  Modal,
  Popconfirm,
  Select,
  Space,
  Spin,
} from 'antd'
import { EnvironmentOutlined, PhoneOutlined, WhatsAppOutlined } from '@ant-design/icons'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getApiErrorMessage } from '../api/errors'
import { getReleaseReasons } from '../api/ordersApi'
import { StatusTag } from '../components/common/StatusTag'
import { useSnackbar } from '../hooks/useSnackbar'
import { useOrdersStore } from '../store/ordersStore'
import type { Order, ReleaseReason, ReleaseReasonCode } from '../types/models'
import { formatLocalDateTime } from '../utils/dateTime'
import { build2gisNavigationUrl } from '../utils/navigation'
import { buildPhoneCallUrl, callViaWebRTC } from '../utils/phone'

function getFiniteNumber(value: number | null | undefined): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined
}

function formatMoney(value: number | null | undefined): string {
  const amount = getFiniteNumber(value)
  return amount !== undefined ? `${amount.toLocaleString('ru-RU')} ₸` : '-'
}

function formatValue(value: string | number | null | undefined): string {
  if (value === null || value === undefined || value === '') {
    return '-'
  }

  return String(value)
}

function getOrderTotalWithServiceFee(order: Order): number | undefined {
  const costSummary = order.costSummary
  const finalTotal = getFiniteNumber(costSummary?.finalTotal)

  if (finalTotal !== undefined) {
    return finalTotal
  }

  const itemsTotal = getFiniteNumber(costSummary?.itemsTotal)

  if (itemsTotal !== undefined) {
    const deliveryPrice = getFiniteNumber(costSummary?.deliveryPrice ?? order.deliveryPrice) ?? 0
    const deliveryServiceFee = getFiniteNumber(costSummary?.deliveryServiceFee) ?? 0
    const serviceFee = getFiniteNumber(costSummary?.serviceFee) ?? 0
    const bonusUsed = getFiniteNumber(costSummary?.bonusUsed ?? order.bonus) ?? 0
    const discount = getFiniteNumber(costSummary?.discount) ?? 0

    return Math.max(itemsTotal + deliveryPrice + deliveryServiceFee + serviceFee - bonusUsed - discount, 0)
  }

  const baseTotal = getFiniteNumber(costSummary?.totalSum ?? order.totalCost)

  if (baseTotal === undefined) {
    return undefined
  }

  return baseTotal + (getFiniteNumber(costSummary?.serviceFee) ?? 0)
}

export function OrderDetailsPage() {
  const { orderId } = useParams()
  const navigate = useNavigate()
  const fetchOrderById = useOrdersStore((state) => state.fetchOrderById)
  const takeOrder = useOrdersStore((state) => state.takeOrder)
  const deliverOrder = useOrdersStore((state) => state.deliverOrder)
  const cancelOrderUnder21 = useOrdersStore((state) => state.cancelOrderUnder21)
  const cancelOrderClientRejected = useOrdersStore((state) => state.cancelOrderClientRejected)
  const releaseOrder = useOrdersStore((state) => state.releaseOrder)
  const selectedOrder = useOrdersStore((state) => state.selectedOrder)
  const [isBusy, setIsBusy] = useState(() => Boolean(orderId))
  const [isTakingOrder, setIsTakingOrder] = useState(false)
  const [isDeliveringOrder, setIsDeliveringOrder] = useState(false)
  const [cancelingAction, setCancelingAction] = useState<'under_21' | 'client_rejected' | null>(null)
  const [isReleaseModalOpen, setIsReleaseModalOpen] = useState(false)
  const [releaseReasons, setReleaseReasons] = useState<ReleaseReason[]>([])
  const [releaseReason, setReleaseReason] = useState<ReleaseReasonCode | undefined>()
  const [releaseComment, setReleaseComment] = useState('')
  const [isLoadingReleaseReasons, setIsLoadingReleaseReasons] = useState(false)
  const [isReleasingOrder, setIsReleasingOrder] = useState(false)
  const [isCallingViaWebRTC, setIsCallingViaWebRTC] = useState(false)
  const { showError } = useSnackbar()

  useEffect(() => {
    if (!orderId) {
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
    if (!selectedOrder || isTakingOrder) {
      return
    }

    const selectedOrderId = selectedOrder.id
    setIsTakingOrder(true)

    try {
      await takeOrder(selectedOrderId)
      await fetchOrderById(selectedOrderId)
      message.success('Заказ взят в доставку')
    } catch (error) {
      showError(getApiErrorMessage(error, 'Не удалось взять заказ в доставку'))
    } finally {
      setIsTakingOrder(false)
    }
  }

  const onDeliverOrder = async () => {
    if (!selectedOrder || isDeliveringOrder) {
      return
    }

    const selectedOrderId = selectedOrder.id
    setIsDeliveringOrder(true)

    try {
      await deliverOrder(selectedOrderId)
      await fetchOrderById(selectedOrderId)
      message.success('Доставка подтверждена')
    } catch (error) {
      showError(getApiErrorMessage(error, 'Не удалось подтвердить доставку'))
    } finally {
      setIsDeliveringOrder(false)
    }
  }

  const onCancelUnder21 = async () => {
    if (!selectedOrder || cancelingAction) {
      return
    }

    const selectedOrderId = selectedOrder.id
    setCancelingAction('under_21')

    try {
      const responseMessage = await cancelOrderUnder21(selectedOrderId)
      await fetchOrderById(selectedOrderId)
      message.success(responseMessage || 'Заказ отменен')
    } catch (error) {
      showError(getApiErrorMessage(error, 'Не удалось отменить заказ'))
    } finally {
      setCancelingAction(null)
    }
  }

  const onCancelClientRejected = async () => {
    if (!selectedOrder || cancelingAction) {
      return
    }

    const selectedOrderId = selectedOrder.id
    setCancelingAction('client_rejected')

    try {
      const responseMessage = await cancelOrderClientRejected(selectedOrderId)
      await fetchOrderById(selectedOrderId)
      message.success(responseMessage || 'Заказ отменен')
    } catch (error) {
      showError(getApiErrorMessage(error, 'Не удалось отменить заказ'))
    } finally {
      setCancelingAction(null)
    }
  }

  const openReleaseModal = async () => {
    if (isLoadingReleaseReasons || isReleasingOrder) {
      return
    }

    setIsReleaseModalOpen(true)
    setIsLoadingReleaseReasons(true)

    try {
      const reasons = await getReleaseReasons()
      setReleaseReasons(reasons)
    } catch (error) {
      setIsReleaseModalOpen(false)
      showError(getApiErrorMessage(error, 'Не удалось загрузить причины снятия заказа'))
    } finally {
      setIsLoadingReleaseReasons(false)
    }
  }

  const closeReleaseModal = () => {
    if (isReleasingOrder) {
      return
    }

    setIsReleaseModalOpen(false)
    setReleaseReason(undefined)
    setReleaseComment('')
  }

  const onReleaseOrder = async () => {
    if (!selectedOrder || !releaseReason || isReleasingOrder) {
      return
    }

    setIsReleasingOrder(true)

    try {
      const responseMessage = await releaseOrder(selectedOrder.id, {
        reason: releaseReason,
        ...(releaseComment.trim() ? { comment: releaseComment.trim() } : {}),
      })
      message.success(responseMessage || 'Вы сняты с заказа')
      navigate('/orders')
    } catch (error) {
      showError(getApiErrorMessage(error, 'Не удалось снять заказ'))
    } finally {
      setIsReleasingOrder(false)
    }
  }

  if (orderId && isBusy) {
    return (
      <div className="empty-state">
        <Spin />
        <p className="empty-state__text">Открываем заказ</p>
      </div>
    )
  }

  if (!selectedOrder || (orderId && selectedOrder.id !== orderId)) {
    return (
      <div className="empty-state">
        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={null} />
        <h1 className="empty-state__title">Заказ не найден</h1>
        <p className="empty-state__text">Проверьте номер заказа или вернитесь к списку доставок.</p>
        <Button className="touch-action secondary-action" onClick={() => navigate('/orders')}>
          К доставкам
        </Button>
      </div>
    )
  }

  const isOrderInDelivery = selectedOrder.statusCode === 3 || selectedOrder.status === 'on_the_way'
  const isOrderFinished =
    selectedOrder.statusCode === 4 ||
    selectedOrder.statusCode === 5 ||
    selectedOrder.statusCode === 53 ||
    selectedOrder.statusCode === 54 ||
    selectedOrder.status === 'delivered' ||
    selectedOrder.status === 'failed' ||
    selectedOrder.status === 'canceled_under_21' ||
    selectedOrder.status === 'canceled_client_rejected'
  const isCancelDisabled = !isOrderInDelivery || isOrderFinished || Boolean(cancelingAction)
  const nextStepTitle = isOrderFinished
    ? 'Заказ завершен'
    : isOrderInDelivery
      ? 'Передайте заказ клиенту'
      : 'Возьмите заказ в работу'
  const nextStepText = isOrderFinished
    ? 'Действия по доставке закрыты. Подробности доступны ниже.'
    : isOrderInDelivery
      ? 'Когда клиент примет заказ, подтвердите выдачу.'
      : 'Сначала возьмите заказ, затем постройте маршрут и свяжитесь с клиентом.'
  const primaryActionLabel = isOrderInDelivery ? 'Выдать заказ' : 'Взять в доставку'
  const addressDetails = selectedOrder.deliveryAddressDetails
  const point = selectedOrder.businessName
    ? `${selectedOrder.businessName}${selectedOrder.businessAddress ? `, ${selectedOrder.businessAddress}` : ''}`
    : selectedOrder.businessAddress
  const orderItems = selectedOrder.items ?? []
  const statusHistory = selectedOrder.statusHistory ?? []
  const orderTotalWithServiceFee = getOrderTotalWithServiceFee(selectedOrder)
  const callUrl = buildPhoneCallUrl(selectedOrder.customerPhone)

  const handleWebRTCCall = async () => {
    if (!selectedOrder?.customerPhone) {
      return
    }
    
    setIsCallingViaWebRTC(true)
    try {
      const success = await callViaWebRTC(selectedOrder.customerPhone)
      if (!success) {
        showError('Не удалось совершить звонок через WebRTC')
      }
    } finally {
      setIsCallingViaWebRTC(false)
    }
  }

  return (
    <div className="screen">
      <section className="screen-hero screen-hero--compact">
        <span className="eyebrow">Заказ #{selectedOrder.id}</span>
        <h1 className="screen-title screen-title--sm">{selectedOrder.customerName}</h1>
        <p className="screen-copy">{selectedOrder.address}</p>
      </section>

      <section className="panel panel--accent">
        <div className="panel__body">
          <div className="panel__header">
            <div>
              <h2 className="panel__title">{nextStepTitle}</h2>
              <p className="panel__text">{nextStepText}</p>
            </div>
            <StatusTag status={selectedOrder.status} />
          </div>

          {!isOrderFinished ? (
            <Button
              block
              type="primary"
              className="touch-action primary-action"
              onClick={isOrderInDelivery ? onDeliverOrder : onTakeOrder}
              loading={isOrderInDelivery ? isDeliveringOrder : isTakingOrder}
              disabled={isDeliveringOrder || isTakingOrder}
            >
              {primaryActionLabel}
            </Button>
          ) : null}

          <Space wrap>
            <Button
              className="touch-action secondary-action"
              href={mapUrl}
              target="_blank"
              icon={<EnvironmentOutlined />}
            >
              Маршрут
            </Button>
            <Button
              className="touch-action secondary-action"
              href={callUrl}
              disabled={!callUrl}
              icon={<PhoneOutlined />}
            >
              Позвонить
            </Button>
            <Button
              className="touch-action secondary-action"
              onClick={handleWebRTCCall}
              loading={isCallingViaWebRTC}
              disabled={!selectedOrder?.customerPhone}
              icon={<PhoneOutlined />}
            >
              WebRTC
            </Button>
            <Button
              className="touch-action secondary-action"
              href={whatsappUrl}
              target="_blank"
              icon={<WhatsAppOutlined />}
            >
              WhatsApp
            </Button>
          </Space>
        </div>
      </section>

      {(selectedOrder.notes || selectedOrder.extra || addressDetails?.comment) ? (
        <Alert
          type="info"
          showIcon
          message="Комментарий к доставке"
          description={selectedOrder.notes || selectedOrder.extra || addressDetails?.comment}
        />
      ) : null}

      <section className="panel">
        <div className="panel__body">
          <h2 className="panel__title">Главное</h2>
          <div className="info-list">
            <InfoRow label="Телефон" value={selectedOrder.customerPhone} />
            <InfoRow label="Адрес" value={selectedOrder.address} />
            <InfoRow label="Квартира" value={addressDetails?.apartment} />
            <InfoRow label="Подъезд" value={addressDetails?.entrance} />
            <InfoRow label="Этаж" value={addressDetails?.floor} />
            <InfoRow label="Оплата" value={selectedOrder.paymentTypeName} />
            <InfoRow label="Итого" value={formatMoney(orderTotalWithServiceFee)} />
            <InfoRow label="Точка" value={point} />
          </div>
        </div>
      </section>

      <Collapse
        items={[
          {
            key: 'items',
            label: 'Позиции заказа',
            children: (
              <List
                dataSource={orderItems}
                locale={{ emptyText: 'Нет позиций' }}
                renderItem={(item) => (
                  <List.Item>
                    <div>
                      <strong>{formatValue(item.name)}</strong>
                      <p className="panel__text">
                        {item.amount ?? 1} шт. · {formatMoney(item.totalCost ?? item.price)}
                      </p>
                    </div>
                  </List.Item>
                )}
              />
            ),
          },
          {
            key: 'cost',
            label: 'Стоимость',
            children: (
              <div className="info-list">
                <InfoRow label="Товары" value={formatMoney(selectedOrder.costSummary?.itemsTotal)} />
                <InfoRow label="Доставка" value={formatMoney(selectedOrder.costSummary?.deliveryPrice ?? selectedOrder.deliveryPrice)} />
                <InfoRow label="Сервис доставки" value={formatMoney(selectedOrder.costSummary?.deliveryServiceFee)} />
                <InfoRow label="Сервис" value={formatMoney(selectedOrder.costSummary?.serviceFee)} />
                <InfoRow label="Бонусы" value={formatMoney(selectedOrder.costSummary?.bonusUsed ?? selectedOrder.bonus)} />
                <InfoRow label="Итого" value={formatMoney(orderTotalWithServiceFee)} />
              </div>
            ),
          },
          {
            key: 'status',
            label: 'История статусов',
            children: (
              <List
                dataSource={statusHistory}
                locale={{ emptyText: 'Нет истории статусов' }}
                renderItem={(item) => (
                  <List.Item>
                    <div>
                      <strong>{item.statusName}</strong>
                      <p className="panel__text">{formatLocalDateTime(item.timestamp)}</p>
                    </div>
                  </List.Item>
                )}
              />
            ),
          },
          {
            key: 'system',
            label: 'Системные данные',
            children: (
              <div className="info-list">
                <InfoRow label="ID" value={selectedOrder.id} />
                <InfoRow label="UUID" value={selectedOrder.orderUuid} />
                <InfoRow label="Адрес в системе" value={selectedOrder.deliveryAddressName} />
                <InfoRow label="Статус" value={selectedOrder.statusName ?? selectedOrder.status} />
                <InfoRow label="Создан" value={formatLocalDateTime(selectedOrder.createdAt)} />
                <InfoRow label="Позиций" value={selectedOrder.itemsCount ?? orderItems.length} />
              </div>
            ),
          },
        ]}
      />

      {!isOrderFinished ? (
        <section className="panel">
          <div className="panel__body">
            <div>
              <h2 className="panel__title">Проблема с заказом</h2>
              <p className="panel__text">Используйте только если заказ нельзя выдать клиенту.</p>
            </div>
            <Space wrap>
              <Popconfirm
                title="Отменить заказ?"
                description="Причина: клиенту нет 21 года"
                okText="Отменить"
                cancelText="Назад"
                onConfirm={() => void onCancelUnder21()}
              >
                <Button
                  className="touch-action danger-action"
                  loading={cancelingAction === 'under_21'}
                  disabled={isCancelDisabled}
                >
                  Нет 21 года
                </Button>
              </Popconfirm>
              <Popconfirm
                title="Отменить заказ?"
                description="Причина: клиент не принимает заказ"
                okText="Отменить"
                cancelText="Назад"
                onConfirm={() => void onCancelClientRejected()}
              >
                <Button
                  className="touch-action danger-action"
                  loading={cancelingAction === 'client_rejected'}
                  disabled={isCancelDisabled}
                >
                  Клиент отказался
                </Button>
              </Popconfirm>
              <Button
                className="touch-action danger-action"
                onClick={() => void openReleaseModal()}
                loading={isLoadingReleaseReasons}
                disabled={isCancelDisabled || isLoadingReleaseReasons || isReleasingOrder}
              >
                Снять с себя
              </Button>
            </Space>
          </div>
        </section>
      ) : null}

      <Modal
        title="Снять с себя заказ"
        open={isReleaseModalOpen}
        okText="Снять с заказа"
        cancelText="Назад"
        okButtonProps={{ danger: true, disabled: !releaseReason, loading: isReleasingOrder }}
        cancelButtonProps={{ disabled: isReleasingOrder }}
        closable={!isReleasingOrder}
        maskClosable={!isReleasingOrder}
        onOk={() => void onReleaseOrder()}
        onCancel={closeReleaseModal}
      >
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <p className="panel__text">Выберите причину. После подтверждения заказ исчезнет из ваших доставок.</p>
          <Select
            style={{ width: '100%' }}
            placeholder="Причина снятия"
            value={releaseReason}
            loading={isLoadingReleaseReasons}
            disabled={isLoadingReleaseReasons || isReleasingOrder}
            options={releaseReasons.map((reason) => ({ value: reason.code, label: reason.label }))}
            onChange={(value: ReleaseReasonCode) => setReleaseReason(value)}
          />
          <Input.TextArea
            rows={4}
            placeholder="Комментарий (необязательно)"
            value={releaseComment}
            disabled={isReleasingOrder}
            onChange={(event) => setReleaseComment(event.target.value)}
          />
        </Space>
      </Modal>
    </div>
  )
}

interface InfoRowProps {
  label: string
  value: string | number | null | undefined
}

function InfoRow({ label, value }: InfoRowProps) {
  return (
    <div className="info-row">
      <span className="info-row__label">{label}</span>
      <span className="info-row__value">{formatValue(value)}</span>
    </div>
  )
}
