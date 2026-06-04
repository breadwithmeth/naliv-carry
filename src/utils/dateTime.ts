import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'

dayjs.extend(utc)

const TIMEZONE_PATTERN = /(z|[+-]\d{2}:?\d{2})$/i
const DATE_TIME_PATTERN = /^\d{4}-\d{2}-\d{2}(?:[ t]\d{2}:\d{2})/i

function parseLocalDateTime(value: string): dayjs.Dayjs {
  const normalizedValue = value.trim()

  if (!DATE_TIME_PATTERN.test(normalizedValue)) {
    return dayjs(normalizedValue)
  }

  if (TIMEZONE_PATTERN.test(normalizedValue)) {
    return dayjs(normalizedValue).local()
  }

  return dayjs.utc(normalizedValue).local()
}

export function formatLocalDateTime(value: string | null | undefined, fallback = '-'): string {
  if (!value?.trim()) {
    return fallback
  }

  const date = parseLocalDateTime(value)
  return date.isValid() ? date.format('DD.MM.YYYY HH:mm') : fallback
}

export function formatLocalTime(value: string | null | undefined, fallback = '-'): string {
  if (!value?.trim()) {
    return fallback
  }

  const date = parseLocalDateTime(value)
  return date.isValid() ? date.format('HH:mm') : fallback
}

export function getDateTimeMs(value: string | null | undefined): number | null {
  if (!value?.trim()) {
    return null
  }

  const date = parseLocalDateTime(value)
  return date.isValid() ? date.valueOf() : null
}
