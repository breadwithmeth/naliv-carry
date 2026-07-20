import { Button } from 'antd'
import { useParams, useNavigate } from 'react-router-dom'
import { openPhoneCall } from '../utils/phone'

export function CallHandlerPage() {
  const { phoneNumber } = useParams<{ phoneNumber: string }>()
  const navigate = useNavigate()

  const handleCall = () => {
    if (phoneNumber) {
      openPhoneCall(phoneNumber)
    }
  }

  const handleGoBack = () => {
    navigate(-1)
  }

  if (!phoneNumber) {
    navigate(-1)
    return null
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      gap: 20,
      padding: 24,
    }}>
      <div style={{ fontSize: 18, textAlign: 'center' }}>
        Позвонить на номер: {phoneNumber}
      </div>
      
      <Button
        type="primary"
        onClick={handleCall}
        style={{ width: '100%', maxWidth: 300 }}
      >
        Позвонить
      </Button>
      
      <Button
        onClick={handleGoBack}
        style={{ width: '100%', maxWidth: 300 }}
      >
        Отмена
      </Button>
    </div>
  )
}
