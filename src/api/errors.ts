import { AxiosError } from 'axios'

interface ApiErrorBody {
  error?: {
    message?: unknown
    code?: unknown
    details?: unknown
  }
  error_description?: unknown
  message?: unknown
  code?: unknown
  status?: unknown
  details?: unknown
}

function isApiErrorBody(value: unknown): value is ApiErrorBody {
  return typeof value === 'object' && value !== null
}

function normalizeMessage(value: unknown): string | null {
  if (typeof value === 'string' && value.trim()) {
    return value
  }

  if (Array.isArray(value)) {
    const messages = value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
    return messages.length > 0 ? messages.join('\n') : null
  }

  return null
}

function extractAllMessages(data: unknown): string[] {
  const messages: string[] = []
  
  if (!isApiErrorBody(data)) {
    return messages
  }

  // Extract from error.message
  const errorMessage = normalizeMessage(data.error?.message)
  if (errorMessage) messages.push(`error.message: ${errorMessage}`)

  // Extract from error_description
  const errorDescription = normalizeMessage(data.error_description)
  if (errorDescription) messages.push(`error_description: ${errorDescription}`)

  // Extract from message
  const message = normalizeMessage(data.message)
  if (message) messages.push(`message: ${message}`)

  // Extract from error.code
  const errorCode = normalizeMessage(data.error?.code)
  if (errorCode) messages.push(`error.code: ${errorCode}`)

  // Extract from code
  const code = normalizeMessage(data.code)
  if (code) messages.push(`code: ${code}`)

  // Extract from status
  const status = normalizeMessage(data.status)
  if (status) messages.push(`status: ${status}`)

  // Extract from error.details
  const errorDetails = normalizeMessage(data.error?.details)
  if (errorDetails) messages.push(`error.details: ${errorDetails}`)

  // Extract from details
  const details = normalizeMessage(data.details)
  if (details) messages.push(`details: ${details}`)

  return messages
}

function getFullErrorDetails(error: unknown): string {
  const parts: string[] = []

  if (error instanceof AxiosError) {
    // Add status code
    if (error.response?.status) {
      parts.push(`Status: ${error.response.status}`)
    }
    
    // Add status text
    if (error.response?.statusText) {
      parts.push(`Status Text: ${error.response.statusText}`)
    }

    // Extract all messages from response data
    if (error.response?.data) {
      const messages = extractAllMessages(error.response.data)
      if (messages.length > 0) {
        parts.push('Response Data:')
        parts.push(...messages.map(m => `  ${m}`))
      }
    }

    // Add error code
    if (error.code) {
      parts.push(`Error Code: ${error.code}`)
    }

    // Add request URL
    if (error.config?.url) {
      parts.push(`URL: ${error.config.url}`)
    }

    // Add request method
    if (error.config?.method) {
      parts.push(`Method: ${error.config.method.toUpperCase()}`)
    }
  }

  if (error instanceof Error) {
    if (error.message) {
      parts.push(`Message: ${error.message}`)
    }
    if (error.stack) {
      parts.push(`Stack: ${error.stack}`)
    }
  }

  // For plain objects, try to extract all messages
  if (!parts.length && isApiErrorBody(error)) {
    const messages = extractAllMessages(error)
    if (messages.length > 0) {
      parts.push('Error Data:')
      parts.push(...messages.map(m => `  ${m}`))
    }
  }

  return parts.length > 0 ? parts.join('\n') : String(error)
}

/**
 * Get a user-friendly error message from an API error.
 * In development mode, appends full error details.
 */
export function getApiErrorMessage(error: unknown, fallback: string): string {
  const isDev = import.meta.env.DEV

  if (!navigator.onLine) {
    return 'Нет интернета. Проверьте подключение и попробуйте снова.'
  }

  if (error instanceof AxiosError && !error.response) {
    if (error.code === 'ECONNABORTED') {
      const baseMessage = 'Сервер долго не отвечает. Проверьте интернет и попробуйте снова.'
      if (isDev) {
        return `${baseMessage}\n\n${getFullErrorDetails(error)}`
      }
      return baseMessage
    }

    const baseMessage = 'Не удалось подключиться к серверу. Проверьте интернет и попробуйте снова.'
    if (isDev) {
      return `${baseMessage}\n\n${getFullErrorDetails(error)}`
    }
    return baseMessage
  }

  if (error instanceof AxiosError && isApiErrorBody(error.response?.data)) {
    const message =
      normalizeMessage(error.response.data.error?.message) ??
      normalizeMessage(error.response.data.error_description) ??
      normalizeMessage(error.response.data.message) ??
      fallback

    if (isDev && message !== fallback) {
      const details = getFullErrorDetails(error)
      if (details && details !== message) {
        return `${message}\n\n${details}`
      }
    }

    return message
  }

  if (error instanceof Error && error.message.trim()) {
    if (isDev) {
      const details = getFullErrorDetails(error)
      if (details && details !== error.message) {
        return `${error.message}\n\n${details}`
      }
    }
    return error.message
  }

  if (isApiErrorBody(error)) {
    const message =
      normalizeMessage(error.error?.message) ??
      normalizeMessage(error.error_description) ??
      normalizeMessage(error.message) ??
      fallback

    if (isDev && message !== fallback) {
      const details = getFullErrorDetails(error)
      if (details && details !== message) {
        return `${message}\n\n${details}`
      }
    }

    return message
  }

  // For any other error in dev mode, show full details
  if (isDev) {
    const details = getFullErrorDetails(error)
    if (details) {
      return `${fallback}\n\n${details}`
    }
  }

  return fallback
}

/**
 * Get full error details for debugging purposes.
 * Useful for logging or displaying in development mode.
 */
export function getFullErrorText(error: unknown): string {
  return getFullErrorDetails(error)
}
