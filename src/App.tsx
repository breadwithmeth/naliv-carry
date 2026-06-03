import { ConfigProvider, App as AntdApp, theme } from 'antd'
import { useEffect } from 'react'
import { AppErrorBoundary } from './components/common/AppErrorBoundary'
import { useTelegramMiniApp } from './hooks/useTelegramMiniApp'
import { AppRouter } from './routes/AppRouter'
import { useThemeStore } from './store/themeStore'

function App() {
  const currentTheme = useThemeStore((state) => state.theme)
  const isDarkMode = currentTheme === 'dark'
  const algorithm = isDarkMode ? theme.darkAlgorithm : theme.defaultAlgorithm

  useTelegramMiniApp()

  useEffect(() => {
    document.documentElement.dataset.theme = currentTheme
    document.documentElement.style.colorScheme = currentTheme
  }, [currentTheme])

  return (
    <ConfigProvider
      theme={{
        algorithm,
        token: {
          colorBgBase: isDarkMode ? '#0A0A0A' : '#FAFAFA',
          colorTextBase: isDarkMode ? '#FAFAFA' : '#111111',
          colorPrimary: '#FF3D00',
          colorInfo: '#FF3D00',
          colorBorder: isDarkMode ? '#262626' : '#D9D9D9',
          colorBorderSecondary: isDarkMode ? '#1F1F1F' : '#E8E8E8',
          colorBgContainer: isDarkMode ? '#0F0F0F' : '#FFFFFF',
          colorBgElevated: isDarkMode ? '#141414' : '#FFFFFF',
          colorTextSecondary: isDarkMode ? '#A3A3A3' : '#5F5F5F',
          borderRadius: 0,
          borderRadiusLG: 0,
          borderRadiusSM: 0,
          controlHeight: 46,
          controlHeightLG: 52,
          fontFamily: '"Inter Tight", Inter, system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
          fontSize: 16,
          lineHeight: 1.35,
        },
        components: {
          Button: {
            borderRadius: 0,
            controlHeight: 46,
            fontWeight: 700,
            primaryColor: '#0A0A0A',
          },
          Card: {
            borderRadiusLG: 0,
            padding: 18,
            paddingLG: 20,
          },
          Input: {
            borderRadius: 0,
            controlHeight: 48,
          },
          Select: {
            borderRadius: 0,
            controlHeight: 48,
          },
          Tag: {
            borderRadiusSM: 0,
          },
        },
      }}
    >
      <AntdApp>
        <AppErrorBoundary>
          <AppRouter />
        </AppErrorBoundary>
      </AntdApp>
    </ConfigProvider>
  )
}

export default App
