import { Alert, Button } from 'antd'
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

  private getErrorMessage = (): string => {
    const { error } = this.state
    if (!error) return ''
    
    // Extract meaningful error message
    if (error.message) {
      return error.message
    }
    
    // Try to get message from error string representation
    const errorString = error.toString()
    if (errorString !== '[object Error]') {
      return errorString
    }
    
    return 'Неизвестная ошибка'
  }

  private getErrorStack = (): string | null => {
    const { error } = this.state
    if (!error?.stack) return null
    
    // Extract first line of stack trace for debugging
    const stackLines = error.stack.split('\n')
    if (stackLines.length > 1) {
      return stackLines[1].trim()
    }
    return null
  }

  render() {
    if (!this.state.error) {
      return this.props.children
    }

    const errorMessage = this.getErrorMessage()
    const errorStack = this.getErrorStack()

    return (
      <main className="app-shell">
        <div className="page-container" style={{ minHeight: '100vh', justifyContent: 'center', padding: 16 }}>
          <section className="empty-state">
            <span className="eyebrow">Ошибка приложения</span>
            <h1 className="empty-state__title">Экран не загрузился</h1>
            
            {errorMessage && (
              <Alert
                type="error"
                showIcon
                message="Детали ошибки:"
                description={
                  <pre style={{ 
                    whiteSpace: 'pre-wrap', 
                    wordBreak: 'break-all',
                    fontSize: 12,
                    maxHeight: 200,
                    overflow: 'auto',
                    background: 'rgba(0,0,0,0.1)',
                    padding: 8,
                    borderRadius: 4
                  }}>
                    {errorMessage}
                    {errorStack ? `

${errorStack}` : ''}
                  </pre>
                }
              />
            )}
            
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
