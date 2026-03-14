import { App } from 'antd'
import { useCallback } from 'react'

interface ShowErrorOptions {
  title?: string
  duration?: number
}

export function useSnackbar() {
  const { notification } = App.useApp()

  const showError = useCallback(
    (description: string, options?: ShowErrorOptions): void => {
      notification.error({
        message: options?.title ?? 'Ошибка',
        description,
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
