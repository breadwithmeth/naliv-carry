import {
  DashboardOutlined,
  EnvironmentOutlined,
  FieldTimeOutlined,
  FundProjectionScreenOutlined,
  MenuOutlined,
  OrderedListOutlined,
  UserOutlined,
} from '@ant-design/icons'
import { Button, Drawer, Space, Layout, Tooltip, Typography } from 'antd'
import { useState, type ReactNode } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { AppUpdatePrompt } from '../common/AppUpdatePrompt'
import { InstallPrompt } from '../common/InstallPrompt'
import { OfflineBanner } from '../common/OfflineBanner'

const { Header, Content } = Layout

interface Props {
  children: ReactNode
}

export function CourierLayout({ children }: Props) {
  const navigate = useNavigate()
  const location = useLocation()
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const primaryMenuItems = [
    { key: '/dashboard', label: 'Главная', icon: <DashboardOutlined /> },
    { key: '/orders', label: 'Доставки', icon: <OrderedListOutlined /> },
    { key: '/shifts', label: 'Смена', icon: <FieldTimeOutlined /> },
    { key: '/profile', label: 'Профиль', icon: <UserOutlined /> },
  ]
  const secondaryMenuItems = [
    { key: '/map', label: 'Карта точек', icon: <EnvironmentOutlined /> },
    { key: '/shifts/payment-report', label: 'Отчет по оплатам', icon: <FundProjectionScreenOutlined /> },
  ]

  const handleNavigate = (path: string): void => {
    navigate(path)
    setIsMenuOpen(false)
  }

  const isActiveItem = (path: string): boolean => {
    return location.pathname === path || location.pathname.startsWith(`${path}/`)
  }

  return (
    <Layout className="app-shell">
      <Header
        className="app-header"
      >
        <div className="app-brand">
          <span className="app-brand__label">Courier</span>
          <Typography.Text className="app-title">
            Naliv Carry
          </Typography.Text>
        </div>
        <Tooltip title="Меню">
          <Button
            aria-label="Открыть меню"
            className="touch-action app-menu-button"
            icon={<MenuOutlined />}
            onClick={() => setIsMenuOpen(true)}
          />
        </Tooltip>
      </Header>
      <Content>
        <div className="page-container">
          <AppUpdatePrompt />
          <InstallPrompt />
          <OfflineBanner />
          {children}
        </div>
      </Content>

      <Drawer
        title="Куда перейти"
        placement="right"
        onClose={() => setIsMenuOpen(false)}
        open={isMenuOpen}
        width="min(360px, 92vw)"
      >
        <Space direction="vertical" style={{ width: '100%' }} size={18}>
          <Space direction="vertical" style={{ width: '100%' }} size={10}>
            {primaryMenuItems.map((item) => (
              <Button
                key={item.key}
                className="touch-action"
                icon={item.icon}
                block
                type={isActiveItem(item.key) ? 'primary' : 'default'}
                onClick={() => handleNavigate(item.key)}
              >
                {item.label}
              </Button>
            ))}
          </Space>

          <Space direction="vertical" style={{ width: '100%' }} size={10}>
            <Typography.Text className="eyebrow">Дополнительно</Typography.Text>
            {secondaryMenuItems.map((item) => (
              <Button
                key={item.key}
                className="touch-action secondary-action"
                icon={item.icon}
                block
                type={isActiveItem(item.key) ? 'primary' : 'default'}
                onClick={() => handleNavigate(item.key)}
              >
                {item.label}
              </Button>
            ))}
          </Space>
        </Space>
      </Drawer>

      <nav className="bottom-nav" aria-label="Основная навигация">
        {primaryMenuItems.map((item) => (
          <button
            key={item.key}
            type="button"
            className={isActiveItem(item.key) ? 'bottom-nav__item bottom-nav__item--active' : 'bottom-nav__item'}
            onClick={() => handleNavigate(item.key)}
          >
            <span className="bottom-nav__icon">{item.icon}</span>
            <span className="bottom-nav__label">{item.label}</span>
          </button>
        ))}
      </nav>
    </Layout>
  )
}
