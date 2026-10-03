import { safeGetItem, safeRemoveItem, safeSetItem } from './safeStorage'

const STORAGE_KEY = 'app_error_log'
const MAX_ENTRIES = 30
const SAME_MESSAGE_INTERVAL_MS = 2000
const MAX_STACK_LINES = 8
const MAX_MESSAGE_LENGTH = 1000

export type ErrorLogSource = 'window.onerror' | 'unhandledrejection' | 'boundary' | 'api'

export interface ErrorLogEntry {
  time: string
  source: ErrorLogSource
  message: string
  stack?: string
}

function readLog(): ErrorLogEntry[] {
  const raw = safeGetItem(STORAGE_KEY)
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? (parsed as ErrorLogEntry[]) : []
  } catch {
    return []
  }
}

function writeLog(entries: ErrorLogEntry[]): void {
  if (safeSetItem(STORAGE_KEY, JSON.stringify(entries))) {
    return
  }

  // Quota still exceeded (the token keys must survive) — keep only recent entries.
  if (entries.length > 5) {
    safeSetItem(STORAGE_KEY, JSON.stringify(entries.slice(-5)))
  }
}

function normalizeMessage(error: unknown): string {
  let message: string
  if (typeof error === 'string') {
    message = error
  } else if (error instanceof Error) {
    message = error.message || error.toString()
  } else if (error && typeof error === 'object') {
    try {
      message = JSON.stringify(error)
    } catch {
      message = String(error)
    }
  } else {
    message = String(error)
  }

  return message.length > MAX_MESSAGE_LENGTH ? `${message.slice(0, MAX_MESSAGE_LENGTH)}…` : message
}

function normalizeStack(error: unknown): string | undefined {
  if (error instanceof Error && error.stack) {
    const stack = error.stack.split('\n').slice(0, MAX_STACK_LINES).join('\n')
    return stack.length > MAX_MESSAGE_LENGTH ? `${stack.slice(0, MAX_MESSAGE_LENGTH)}…` : stack
  }
  return undefined
}

let lastMessage = ''
let lastTime = 0

/**
 * Append an error to the local ring buffer in localStorage.
 * Rate-limits identical consecutive messages to avoid storage spam.
 */
export function logError(source: ErrorLogSource, error: unknown): void {
  const message = normalizeMessage(error)
  const now = Date.now()

  if (message === lastMessage && now - lastTime < SAME_MESSAGE_INTERVAL_MS) {
    return
  }

  lastMessage = message
  lastTime = now

  const entry: ErrorLogEntry = {
    time: new Date(now).toLocaleTimeString(),
    source,
    message,
    stack: normalizeStack(error),
  }

  const entries = [...readLog(), entry].slice(-MAX_ENTRIES)
  writeLog(entries)
}

export function getErrorLog(): ErrorLogEntry[] {
  return readLog()
}

export function formatErrorLog(entries: ErrorLogEntry[] = getErrorLog()): string {
  if (entries.length === 0) {
    return 'Журнал ошибок пуст'
  }

  return entries
    .map((entry) => {
      const stack = entry.stack ? `\n${entry.stack}` : ''
      return `[${entry.time}] (${entry.source}) ${entry.message}${stack}`
    })
    .join('\n\n')
}

export function clearErrorLog(): void {
  safeRemoveItem(STORAGE_KEY)
}

/** iOS WebKit (Telegram iOS WebView) has a very low per-domain storage quota
 * and throws QuotaExceededError even on small payloads — including from inside
 * telegram-web-app.js, where we cannot catch it. Treat it as known noise. */
export function isIosQuotaNoise(error: unknown): boolean {
  const message = error instanceof Error ? `${error.name}: ${error.message}` : String(error)
  return /quota|NS_ERROR_DOM_QUOTA_REACHED/i.test(message)
}
