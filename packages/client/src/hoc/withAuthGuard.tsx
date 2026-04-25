// Этот HOC авторизации использует хук useAuthGuard;
// Оборачивает дерево роутера; публичные пути задаются в 'router/publicRoutePaths.ts'
// При loading показывает loader; при denied делает <Navigate to="/login" replace />;
// При allowed рендерит обернутый в него компонент.

import React, {
  useEffect,
  useMemo,
  useState,
} from 'react'
import clsx from 'clsx'
import {
  Navigate,
  useLocation,
} from 'react-router-dom'
import { useAuthGuard } from '../hooks/useAuthGuard'
import { useLandingTheme } from '../contexts/LandingThemeContext'
import {
  ARENA_BG_CHANGED_EVENT,
  readResolvedArenaPhotoUrl,
} from '../game/match3/match3ArenaBackground'

export function withAuthGuard<P extends object>(
  WrappedComponent: React.ComponentType<P>
) {
  const GuardedComponent: React.FC<P> = props => {
    const status = useAuthGuard()
    const location = useLocation()
    const { theme } = useLandingTheme()
    const [arenaBgTick, setArenaBgTick] =
      useState(0)

    const isGameRoute =
      location.pathname.startsWith('/game')

    const resolvedArenaUrl = useMemo(() => {
      void arenaBgTick
      return readResolvedArenaPhotoUrl()
    }, [arenaBgTick])

    useEffect(() => {
      const bump = () =>
        setArenaBgTick(n => n + 1)
      bump()
      const onStorage = (e: StorageEvent) => {
        if (
          e.key == null ||
          e.key.startsWith('match3:arena-bg')
        ) {
          bump()
        }
      }
      window.addEventListener(
        'storage',
        onStorage
      )
      window.addEventListener(
        ARENA_BG_CHANGED_EVENT,
        bump
      )
      return () => {
        window.removeEventListener(
          'storage',
          onStorage
        )
        window.removeEventListener(
          ARENA_BG_CHANGED_EVENT,
          bump
        )
      }
    }, [])

    const showShellArena =
      Boolean(resolvedArenaUrl) && !isGameRoute

    const shellStyle = showShellArena
      ? ({
          ['--m3-arena-photo' as string]: `url("${String(
            resolvedArenaUrl
          ).replace(/"/g, '%22')}")`,
        } as React.CSSProperties)
      : undefined

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

    return (
      <div
        className={clsx(
          'user-app-shell',
          showShellArena &&
            'user-app-shell--arena-photo'
        )}
        data-user-theme={theme}
        style={shellStyle}>
        <WrappedComponent {...props} />
      </div>
    )
  }

  GuardedComponent.displayName = `withAuthGuard(${
    WrappedComponent.displayName ||
    WrappedComponent.name ||
    'Component'
  })`

  return GuardedComponent
}
