import { BulbOutlined, BulbFilled } from '@ant-design/icons'
import { Button } from 'antd'
import { useThemeStore } from '../../store/themeStore'

export function ThemeToggle() {
  const theme = useThemeStore((state) => state.theme)
  const toggleTheme = useThemeStore((state) => state.toggleTheme)

  return (
    <Button
      className="touch-action"
      icon={theme === 'light' ? <BulbOutlined /> : <BulbFilled />}
      onClick={toggleTheme}
    >
      {theme === 'light' ? 'Тёмная' : 'Светлая'}
    </Button>
  )
}
