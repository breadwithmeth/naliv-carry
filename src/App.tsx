import { ConfigProvider, App as AntdApp, theme } from 'antd'
import { AppRouter } from './routes/AppRouter'
import { useThemeStore } from './store/themeStore'

function App() {
  const currentTheme = useThemeStore((state) => state.theme)
  const algorithm = currentTheme === 'dark' ? theme.darkAlgorithm : theme.defaultAlgorithm

  return (
    <ConfigProvider
      theme={{
        algorithm,
        token: {
          colorPrimary: '#1677ff',
          borderRadius: 10,
          fontSize: 14,
        },
      }}
    >
      <AntdApp>
        <AppRouter />
      </AntdApp>
    </ConfigProvider>
  )
}

export default App
