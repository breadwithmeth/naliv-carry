import { App } from 'antd'
import { useCallback } from 'react'
import { getFullErrorText } from '../api/errors'

interface ShowErrorOptions {
  title?: string
  duration?: number
  error?: unknown
}

export function useSnackbar() {
  const { notification } = App.useApp()

  const showError = useCallback(
    (description: string, options?: ShowErrorOptions): void => {
      let fullDescription = description
      
      // In development mode, append full error details if error object is provided
      if (import.meta.env.DEV && options?.error) {
        const errorDetails = getFullErrorText(options.error)
        if (errorDetails && errorDetails !== description) {
          fullDescription = `${description}\n\n${errorDetails}`
        }
      }

      notification.error({
        message: options?.title ?? 'Ошибка',
        description: fullDescription,
        placement: 'bottomRight',
        duration: options?.duration ?? 4,
        showProgress: true,
        pauseOnHover: true,
      })
    },
    [notification],
  )

  return {
    showError,
  }
}
