import { OFFLINE_QUEUE_KEY } from './constants'
import type { DeliveryStatus } from '../types/models'

export interface QueuedStatusUpdate {
  orderId: string
  status: DeliveryStatus
  createdAt: string
}

export function getQueue(): QueuedStatusUpdate[] {
  const raw = localStorage.getItem(OFFLINE_QUEUE_KEY)
  if (!raw) {
    return []
  }

  try {
    return JSON.parse(raw) as QueuedStatusUpdate[]
  } catch {
    return []
  }
}

export function enqueueStatusUpdate(item: QueuedStatusUpdate): void {
  const queue = getQueue()
  queue.push(item)
  localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue))
}

export function clearQueue(): void {
  localStorage.removeItem(OFFLINE_QUEUE_KEY)
}
