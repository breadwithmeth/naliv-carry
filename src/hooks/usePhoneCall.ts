import { message } from 'antd'
import { useCallback } from 'react'
import type { MouseEvent } from 'react'
import { copyPhoneNumber, openPhoneCall } from '../utils/phone'

export function usePhoneCall() {
  return useCallback((event: MouseEvent<HTMLElement>, phone: string | null | undefined): void => {
    event.preventDefault()

    const copyPromise = copyPhoneNumber(phone)
    const opened = openPhoneCall(phone)

    void copyPromise.then((copied) => {
      if (!opened) {
        if (copied) {
          message.warning('Не удалось открыть звонок. Номер скопирован.')
        } else {
          message.warning('Не удалось открыть звонок. Скопируйте номер вручную.')
        }

        return
      }

      if (copied && document.visibilityState === 'visible') {
        message.info('Если звонок не открылся, номер скопирован.')
      }
    })
  }, [])
}
