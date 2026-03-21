import { Alert, Button, Card, List, Space, Typography, message } from 'antd'
import { EnvironmentOutlined } from '@ant-design/icons'
import { useEffect } from 'react'
import { useSnackbar } from '../hooks/useSnackbar'
import { useCourierStore } from '../store/courierStore'
import { useOrdersStore } from '../store/ordersStore'
import { build2gisNavigationUrl } from '../utils/navigation'

export function MapPage() {
  const orders = useOrdersStore((state) => state.orders)
  const cities = useCourierStore((state) => state.cities)
  const location = useCourierStore((state) => state.location)
  const loadCities = useCourierStore((state) => state.loadCities)
  const loadLocation = useCourierStore((state) => state.loadLocation)
  const saveLocation = useCourierStore((state) => state.saveLocation)
  const { showError } = useSnackbar()

  const lastLocationDate = location?.updated_at ? new Date(location.updated_at) : null
  const locationAgeMs = lastLocationDate ? Date.now() - lastLocationDate.getTime() : null
  const isLocationStale =
    !location || !lastLocationDate || Number.isNaN(lastLocationDate.getTime()) || (locationAgeMs ?? 0) > 6 * 60 * 60 * 1000

  useEffect(() => {
    loadCities().catch(() => {
      // Optional UI data.
    })
    loadLocation().catch(() => {
      // Optional UI data.
    })
  }, [loadCities, loadLocation])

  const handleSaveCurrentLocation = () => {
    if (!navigator.geolocation) {
      showError('Геолокация не поддерживается браузером')
      return
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          await saveLocation(position.coords.latitude, position.coords.longitude)
          message.success('Геолокация курьера сохранена')
        } catch {
          showError('Не удалось сохранить геолокацию')
        }
      },
      () => {
        showError('Не удалось получить текущие координаты')
      },
    )
  }

  return (
    <>
      <Typography.Title level={4} style={{ margin: 0 }}>
        Точки доставки
      </Typography.Title>
      <Card>
        <Space direction="vertical" style={{ width: '100%' }}>
          {isLocationStale ? (
            <Alert
              type="warning"
              showIcon
              message="Геолокация неактуальна"
              description="Последняя геолокация отсутствует или обновлялась более 6 часов назад. Скачайте приложение Traccar Client."
            />
          ) : null}
          <Typography.Text>
            {location
              ? `Текущая геолокация: ${location.lat}, ${location.lon}`
              : 'Геолокация курьера не найдена'}
          </Typography.Text>
          {location?.updated_at ? (
            <Typography.Text type="secondary">
              Последнее обновление: {new Date(location.updated_at).toLocaleString('ru-RU')}
            </Typography.Text>
          ) : null}
          <Button type="primary" className="touch-action" onClick={handleSaveCurrentLocation}>
            Сохранить мою геолокацию
          </Button>
          <Typography.Text type="secondary">
            Города: {cities.length ? cities.map((item) => item.name).join(', ') : 'не загружены'}
          </Typography.Text>
        </Space>
      </Card>
      <Card>
        <iframe
          title="Карта доставки"
          src="https://www.openstreetmap.org/export/embed.html"
          style={{ border: 0, width: '100%', minHeight: 280, borderRadius: 10 }}
        />
      </Card>
      <List
        dataSource={orders}
        renderItem={(order) => {
          const lat = order.latitude ?? 0
          const lon = order.longitude ?? 0
          const mapUrl = build2gisNavigationUrl(lat, lon)
          return (
            <List.Item>
              <List.Item.Meta title={order.customerName} description={order.address} />
              <Button
                className="touch-action"
                icon={<EnvironmentOutlined />}
                href={mapUrl}
                target="_blank"
              >
                Открыть
              </Button>
            </List.Item>
          )
        }}
      />
    </>
  )
}
