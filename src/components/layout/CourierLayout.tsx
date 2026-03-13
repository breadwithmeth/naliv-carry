import {
  DashboardOutlined,
  EnvironmentOutlined,
  FieldTimeOutlined,
  MenuOutlined,
  OrderedListOutlined,
  UserOutlined,
} from '@ant-design/icons'
import { Button, Drawer, Space, Layout, Typography } from 'antd'
import { useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { OfflineBanner } from '../common/OfflineBanner'

const { Header, Content } = Layout

interface Props {
  children: ReactNode
}

export function CourierLayout({ children }: Props) {
  const navigate = useNavigate()
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const menuItems = [
    { key: '/dashboard', label: 'Главная', icon: <DashboardOutlined /> },
    { key: '/shifts', label: 'Смены', icon: <FieldTimeOutlined /> },
    { key: '/orders', label: 'Заказы', icon: <OrderedListOutlined /> },
    { key: '/map', label: 'Карта', icon: <EnvironmentOutlined /> },
    { key: '/profile', label: 'Профиль', icon: <UserOutlined /> },
  ]

  const handleNavigate = (path: string): void => {
    navigate(path)
    setIsMenuOpen(false)
  }

  return (
    <Layout style={{ minHeight: '100%' }}>
      <Header
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '0 12px',
          gap: 8,
          position: 'sticky',
          top: 0,
          zIndex: 20,
        }}
      >
        <Typography.Text style={{ color: '#fff', fontWeight: 700, whiteSpace: 'nowrap' }}>
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
      >
        <Space direction="vertical" style={{ width: '100%' }} size={12}>
          {menuItems.map((item) => (
            <Button
              key={item.key}
              className="touch-action"
              icon={item.icon}
              block
              onClick={() => handleNavigate(item.key)}
            >
              {item.label}
            </Button>
          ))}
        </Space>
      </Drawer>
    </Layout>
  )
}
