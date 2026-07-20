import { useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'

export function CallHandlerPage() {
  const { phoneNumber } = useParams<{ phoneNumber: string }>()
  const navigate = useNavigate()

  useEffect(() => {
    if (phoneNumber) {
      // Build tel: URL and open it
      const telUrl = `tel:${phoneNumber}`
      const webApp = window.Telegram?.WebApp
      
      if (webApp?.openLink) {
        webApp.openLink(telUrl)
      } else {
        window.location.href = telUrl
      }
      
      // Redirect back after a small delay
      const timer = setTimeout(() => {
        navigate(-1)
      }, 500)
      
      return () => clearTimeout(timer)
    } else {
      // No phone number, redirect back immediately
      navigate(-1)
    }
  }, [phoneNumber, navigate])

  // Loading state
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      fontSize: 18,
    }}>
      Осуществляется звонок...
    </div>
  )
}
