import { Tag } from 'antd'
import type { DeliveryStatus } from '../../types/models'

const statusConfig: Record<DeliveryStatus, { label: string }> = {
  pending: { label: 'Ждет курьера' },
  on_the_way: { label: 'Везете' },
  delivered: { label: 'Выдан' },
  failed: { label: 'Проблема' },
  canceled_under_21: { label: 'Нет 21 года' },
  canceled_client_rejected: { label: 'Отказ клиента' },
}

interface Props {
  status: DeliveryStatus
}

export function StatusTag({ status }: Props) {
  const config = statusConfig[status]
  return <Tag className={`status-tag status-tag--${status}`}>{config.label}</Tag>
}
