import {
  DashboardOutlined,
  EnvironmentOutlined,
  FieldTimeOutlined,
  FundProjectionScreenOutlined,
  MenuOutlined,
  OrderedListOutlined,
  UserOutlined,
} from '@ant-design/icons'
import { Button, Drawer, Space, Layout, Typography } from 'antd'
import { useState, type ReactNode } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { OfflineBanner } from '../common/OfflineBanner'

const { Header, Content } = Layout

interface Props {
  children: ReactNode
}

export function CourierLayout({ children }: Props) {
  const navigate = useNavigate()
  const location = useLocation()
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const menuItems = [
    { key: '/dashboard', label: 'Главная', icon: <DashboardOutlined /> },
    { key: '/shifts', label: 'Смены', icon: <FieldTimeOutlined /> },
    { key: '/shifts/payment-report', label: 'Отчет по оплатам', icon: <FundProjectionScreenOutlined /> },
    { key: '/orders', label: 'Заказы', icon: <OrderedListOutlined /> },
    { key: '/map', label: 'Карта', icon: <EnvironmentOutlined /> },
    { key: '/profile', label: 'Профиль', icon: <UserOutlined /> },
  ]
  const bottomNavItems = menuItems.filter((item) => item.key !== '/shifts/payment-report')

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
        <Typography.Text className="app-title">
          Naliv Carry
        </Typography.Text>
        <Button
          className="touch-action"
          icon={<MenuOutlined />}
          onClick={() => setIsMenuOpen(true)}
        >
          Меню
        </Button>
      </Header>
      <Content>
        <div className="page-container">
          <OfflineBanner />
          {children}
        </div>
      </Content>

      <Drawer
        title="Навигация"
        placement="right"
        onClose={() => setIsMenuOpen(false)}
        open={isMenuOpen}
        width="min(360px, 92vw)"
      >
        <Space direction="vertical" style={{ width: '100%' }} size={12}>
          {menuItems.map((item) => (
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
      </Drawer>

      <nav className="bottom-nav" aria-label="Основная навигация">
        {bottomNavItems.map((item) => (
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
