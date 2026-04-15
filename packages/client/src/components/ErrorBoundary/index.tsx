// Обертка для обработки ошибок в компонентах.
import React from 'react'
import { AppErrorFallback } from '../AppErrorFallback'

type Props = {
  children: React.ReactNode
}

type State = {
  hasError: boolean
}

export class ErrorBoundary extends React.Component<
  Props,
  State
> {
  state: State = { hasError: false }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(
    error: Error,
    errorInfo: React.ErrorInfo
  ) {
    // TODO: заменить на реальный логгер / Sentry
    console.error(
      'ErrorBoundary caught error:',
      error,
      errorInfo
    )
  }

  render() {
    if (this.state.hasError) {
      return <AppErrorFallback />
    }

    return this.props.children
  }
}
