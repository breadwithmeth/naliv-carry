import { AxiosError } from 'axios'

interface ApiErrorBody {
  error?: {
    message?: unknown
  }
  error_description?: unknown
  message?: unknown
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

export function getApiErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof AxiosError && isApiErrorBody(error.response?.data)) {
    return (
      normalizeMessage(error.response.data.error?.message) ??
      normalizeMessage(error.response.data.error_description) ??
      normalizeMessage(error.response.data.message) ??
      fallback
    )
  }

  if (error instanceof Error && error.message.trim()) {
    return error.message
  }

  if (isApiErrorBody(error)) {
    return (
      normalizeMessage(error.error?.message) ??
      normalizeMessage(error.error_description) ??
      normalizeMessage(error.message) ??
      fallback
    )
  }

  return fallback
}
