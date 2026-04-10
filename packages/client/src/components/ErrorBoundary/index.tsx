// Обертка для обработки ошибок в компонентах.
import React from 'react'
import { Link } from 'react-router-dom'

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
      return (
        <div className="ErrorBoundary ErrorBoundary--app">
          <h1>Космическая турбулентность</h1>
          <p>
            Что-то пошло не так. Попробуйте
            обновить страницу.
          </p>
          <Link
            to="/"
            className="Button Button--primary">
            Вернуться на главную
          </Link>
        </div>
      )
    }

    return this.props.children
  }
}
