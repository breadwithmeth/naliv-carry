import { Tag } from 'antd'
import type { DeliveryStatus } from '../../types/models'

const statusConfig: Record<DeliveryStatus, { color: string; label: string }> = {
  pending: { color: 'default', label: 'В ожидании' },
  on_the_way: { color: 'processing', label: 'В пути' },
  delivered: { color: 'success', label: 'Доставлен' },
  failed: { color: 'error', label: 'Не доставлен' },
  canceled_under_21: { color: 'warning', label: 'Отменен: нет 21 года' },
  canceled_client_rejected: { color: 'warning', label: 'Отменен: клиент отказался' },
}

interface Props {
  status: DeliveryStatus
}

export function StatusTag({ status }: Props) {
  const config = statusConfig[status]
  return <Tag color={config.color}>{config.label}</Tag>
}
