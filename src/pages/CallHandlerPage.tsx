import { Button, Spin } from 'antd'
import { useParams, useNavigate } from 'react-router-dom'
import { openPhoneCall, callViaWebRTC, closeWebRTCConnection } from '../utils/phone'
import { useState } from 'react'

export function CallHandlerPage() {
  const { phoneNumber } = useParams<{ phoneNumber: string }>()
  const navigate = useNavigate()
  const [isCalling, setIsCalling] = useState(false)

  const handleRegularCall = () => {
    if (phoneNumber) {
      openPhoneCall(phoneNumber)
      navigate(-1)
    }
  }

  const handleWebRTCCall = async () => {
    if (!phoneNumber) return
    
    setIsCalling(true)
    try {
      const success = await callViaWebRTC(phoneNumber)
      if (!success) {
        handleRegularCall()
      } else {
        navigate(-1)
      }
    } finally {
      setIsCalling(false)
    }
  }

  const handleGoBack = () => {
    closeWebRTCConnection()
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
      
      {isCalling ? (
        <Spin tip="Соединяем..." size="large" />
      ) : (
        <>
          <Button
            type="primary"
            onClick={handleWebRTCCall}
            style={{ width: '100%', maxWidth: 300 }}
          >
            Позвонить через WebRTC
          </Button>
          
          <Button
            onClick={handleRegularCall}
            style={{ width: '100%', maxWidth: 300 }}
          >
            Обычный звонок
          </Button>
        </>
      )}
      
      <Button
        onClick={handleGoBack}
        style={{ width: '100%', maxWidth: 300 }}
      >
        Отмена
      </Button>
    </div>
  )
}
