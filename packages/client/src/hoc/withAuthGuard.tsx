import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuthGuard } from '../hooks/useAuthGuard'

export function withAuthGuard<P extends object>(
  WrappedComponent: React.ComponentType<P>
) {
  const GuardedComponent: React.FC<P> = props => {
    const status = useAuthGuard()

    if (status === 'loading') {
      return (
        <div
          className="protected-route__loading"
          role="status"
          aria-live="polite"
          aria-busy="true">
          <p className="protected-route__loading-text">
            Проверяем авторизацию...
          </p>
        </div>
      )
    }

    if (status === 'denied') {
      return <Navigate to="/login" replace />
    }

    return <WrappedComponent {...props} />
  }

  GuardedComponent.displayName = `withAuthGuard(${
    WrappedComponent.displayName ||
    WrappedComponent.name ||
    'Component'
  })`

  return GuardedComponent
}
