import { Alert, Button } from 'antd'
import { Component, type ErrorInfo, type ReactNode } from 'react'
import { decodeReactErrorMessage } from '../../api/errors'

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
      // Try to decode React minified errors
      const decoded = decodeReactErrorMessage(error.message)
      if (decoded) {
        return decoded
      }
      return error.message
    }
    
    // Try to get message from error string representation
    const errorString = error.toString()
    if (errorString !== '[object Error]') {
      // Try to decode React minified errors from string
      const decoded = decodeReactErrorMessage(errorString)
      if (decoded) {
        return decoded
      }
      return errorString
    }
    
    return 'Неизвестная ошибка'
  }

  private getErrorStack = (): string | null => {
    const { error } = this.state
    if (!error?.stack) return null
    
    // In development, show full stack trace
    if (import.meta.env.DEV) {
      return error.stack
    }
    
    // In production, show only first line of stack trace
    const stackLines = error.stack.split('\n')
    if (stackLines.length > 1) {
      return stackLines[1].trim()
    }
    return null
  }

  private getErrorDetails = (): string | null => {
    const { error } = this.state
    if (!error) return null

    // In development mode, include additional error information
    if (import.meta.env.DEV) {
      const details: string[] = []
      
      // Add error name
      if (error.name) {
        details.push(`Name: ${error.name}`)
      }
      
      // Add cause if available (TypeScript may not recognize Error.cause in older targets)
      if ('cause' in error && error.cause) {
        details.push(`Cause: ${String((error as { cause: unknown }).cause)}`)
      }
      
      // Add full stack if not already included
      if (error.stack) {
        details.push('Stack Trace:')
        details.push(error.stack)
      }
      
      if (details.length > 0) {
        return details.join('\n')
      }
    }
    
    return null
  }

  render() {
    if (!this.state.error) {
      return this.props.children
    }

    const errorMessage = this.getErrorMessage()
    const errorStack = this.getErrorStack()
    const errorDetails = this.getErrorDetails()

    return (
      <main className="app-shell">
        <div className="page-container" style={{ minHeight: '100vh', justifyContent: 'center', padding: 16 }}>
          <section className="empty-state">
            <span className="eyebrow">Ошибка приложения</span>
            <h1 className="empty-state__title">Экран не загрузился</h1>
            
            {(errorMessage || errorStack || errorDetails) && (
              <Alert
                type="error"
                showIcon
                message={import.meta.env.DEV ? "Полные детали ошибки:" : "Детали ошибки:"}
                description={
                  <pre style={{ 
                    whiteSpace: 'pre-wrap', 
                    wordBreak: 'break-all',
                    fontSize: import.meta.env.DEV ? 11 : 12,
                    maxHeight: import.meta.env.DEV ? 400 : 200,
                    overflow: 'auto',
                    background: 'rgba(0,0,0,0.1)',
                    padding: 8,
                    borderRadius: 4
                  }}>
                    {errorMessage}
                    {errorStack ? `

${errorStack}` : ''}
                    {errorDetails ? `

${errorDetails}` : ''}
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
