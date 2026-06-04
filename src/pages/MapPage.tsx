import { Alert, Button, Empty, List, Spin, message } from 'antd'
import { EnvironmentOutlined } from '@ant-design/icons'
import { useEffect } from 'react'
import { useSnackbar } from '../hooks/useSnackbar'
import { useCourierStore } from '../store/courierStore'
import { useOrdersStore } from '../store/ordersStore'
import { formatLocalTime, getDateTimeMs } from '../utils/dateTime'
import { build2gisNavigationUrl } from '../utils/navigation'

const PAGE_OPENED_AT_MS = Date.now()

export function MapPage() {
  const orders = useOrdersStore((state) => (Array.isArray(state.orders) ? state.orders : []))
  const fetchOrders = useOrdersStore((state) => state.fetchOrders)
  const isOrdersLoading = useOrdersStore((state) => state.isLoading)
  const cities = useCourierStore((state) => state.cities)
  const location = useCourierStore((state) => state.location)
  const isLoadingLocation = useCourierStore((state) => state.isLoadingLocation)
  const loadCities = useCourierStore((state) => state.loadCities)
  const loadLocation = useCourierStore((state) => state.loadLocation)
  const saveLocation = useCourierStore((state) => state.saveLocation)
  const { showError } = useSnackbar()

  const lastLocationMs = getDateTimeMs(location?.updated_at)
  const locationAgeMs = lastLocationMs ? PAGE_OPENED_AT_MS - lastLocationMs : null
  const isLocationStale =
    !location || !lastLocationMs || (locationAgeMs ?? 0) > 6 * 60 * 60 * 1000

  useEffect(() => {
    loadCities().catch(() => {
      // Optional UI data.
    })
    loadLocation().catch(() => {
      // Optional UI data.
    })
    fetchOrders().catch(() => {
      // Optional UI data.
    })
  }, [fetchOrders, loadCities, loadLocation])

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
    <div className="screen">
      <section className="screen-hero screen-hero--compact">
        <span className="eyebrow">Карта</span>
        <h1 className="screen-title screen-title--sm">Маршруты</h1>
        <p className="screen-copy">Сохраните свою точку или откройте маршрут к доставке.</p>
        <Button
          type="primary"
          block
          className="touch-action primary-action"
          loading={isLoadingLocation}
          onClick={handleSaveCurrentLocation}
        >
          Сохранить мою геолокацию
        </Button>
      </section>

      {isLocationStale ? (
        <Alert
          type="warning"
          showIcon
          message="Геолокация устарела"
          description="Обновите точку, чтобы диспетчер видел актуальное положение."
        />
      ) : null}

      <section className="metric-grid" aria-label="Геолокация">
        <div className="metric">
          <span className="metric__label">Точка</span>
          <span className="metric__value">{location ? 'Есть' : 'Нет'}</span>
        </div>
        <div className="metric">
          <span className="metric__label">Обновлена</span>
          <span className="metric__value">
            {formatLocalTime(location?.updated_at)}
          </span>
        </div>
      </section>

      <section className="panel">
        <iframe
          className="map-frame"
          title="Карта доставки"
          src="https://www.openstreetmap.org/export/embed.html"
        />
      </section>

      <section className="panel">
        <div className="panel__body">
          <div className="panel__header">
            <div>
              <h2 className="panel__title">Точки доставки</h2>
              <p className="panel__text">
                {cities.length ? `Город: ${cities.map((item) => item.name).join(', ')}` : 'Город не загружен'}
              </p>
            </div>
            {isOrdersLoading ? <Spin size="small" /> : null}
          </div>
          <List
            dataSource={orders}
            locale={{ emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Нет доставок на карте" /> }}
            renderItem={(order) => {
              const lat = order.deliveryAddressCoordinates?.lat ?? order.latitude ?? 0
              const lon = order.deliveryAddressCoordinates?.lon ?? order.longitude ?? 0
              const mapUrl = build2gisNavigationUrl(lat, lon)
              return (
                <List.Item>
                  <div style={{ minWidth: 0 }}>
                    <strong>{order.customerName}</strong>
                    <p className="panel__text">{order.address}</p>
                  </div>
                  <Button
                    className="touch-action secondary-action"
                    icon={<EnvironmentOutlined />}
                    href={mapUrl}
                    target="_blank"
                  >
                    Маршрут
                  </Button>
                </List.Item>
              )
            }}
          />
        </div>
      </section>
    </div>
  )
}
