import { OFFLINE_QUEUE_KEY } from './constants'
import { safeGetItem, safeRemoveItem, safeSetItem } from './safeStorage'
import type { DeliveryStatus } from '../types/models'

export interface QueuedStatusUpdate {
  orderId: string
  status: DeliveryStatus
  createdAt: string
}

const MAX_QUEUE_SIZE = 100

export function getQueue(): QueuedStatusUpdate[] {
  const raw = safeGetItem(OFFLINE_QUEUE_KEY)
  if (!raw) {
    return []
  }

  try {
    const parsed = JSON.parse(raw) as QueuedStatusUpdate[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function enqueueStatusUpdate(item: QueuedStatusUpdate): boolean {
  const queue = getQueue()
  // Drop the oldest entries when the queue grows unbounded — the sync loop
  // will re-apply the newest status for each order anyway.
  queue.push(item)
  const trimmed = queue.slice(-MAX_QUEUE_SIZE)
  return safeSetItem(OFFLINE_QUEUE_KEY, JSON.stringify(trimmed))
}

export function clearQueue(): void {
  safeRemoveItem(OFFLINE_QUEUE_KEY)
}
