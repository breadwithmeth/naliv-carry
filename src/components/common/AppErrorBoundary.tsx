import { Button } from 'antd'
import { Component, type ErrorInfo, type ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  error: Error | null
}

export class AppErrorBoundary extends Component<Props, State> {
  state: State = {
    error: null,
  }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('App render failed', error, errorInfo)
  }

  private reset = (): void => {
    this.setState({ error: null })
  }

  private reload = (): void => {
    window.location.reload()
  }

  render() {
    if (!this.state.error) {
      return this.props.children
    }

    return (
      <main className="app-shell">
        <div className="page-container" style={{ minHeight: '100vh', justifyContent: 'center' }}>
          <section className="empty-state">
            <span className="eyebrow">Ошибка приложения</span>
            <h1 className="empty-state__title">Экран не загрузился</h1>
            <p className="empty-state__text">
              Мы сохранили приложение открытым. Обновите экран или вернитесь назад, если ошибка повторится.
            </p>
            <Button block type="primary" className="touch-action" onClick={this.reload}>
              Обновить
            </Button>
            <Button block className="touch-action secondary-action" onClick={this.reset}>
              Попробовать без перезагрузки
            </Button>
          </section>
        </div>
      </main>
    )
  }
}
