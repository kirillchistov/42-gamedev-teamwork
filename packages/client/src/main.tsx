// 6.5 Подключил HOC withAuthGuard в роутинг
import React from 'react'
import ReactDOM from 'react-dom/client'
import {
  createBrowserRouter,
  RouterProvider,
} from 'react-router-dom'
import { Provider } from 'react-redux'
import { ThemeProvider } from '@gravity-ui/uikit'
import { store } from './store'
import { routes } from './routes'
import { LandingThemeProvider } from './contexts/LandingThemeContext'
import { withAuthGuard } from './hoc/withAuthGuard'
import './shared/styles/normalize.pcss'
import './shared/styles/base.pcss'
import './shared/styles/landing.pcss'
import './shared/styles/site-cards.pcss'
import './shared/styles/auth.pcss'
import './shared/styles/error-pages.pcss'
import './shared/styles/cosmic-error.pcss'
import './shared/styles/leaderboard.pcss'
import './shared/styles/themes.pcss'
import './shared/styles/match3-theme.pcss'
import './shared/styles/responsive.pcss'
import './shared/styles/forum.pcss'
import '@gravity-ui/uikit/styles/fonts.css'
import '@gravity-ui/uikit/styles/styles.css'
import { ErrorBoundary } from './components/ErrorBoundary'
import { isPublicRoutePath } from './router/publicRoutePaths'

const routerBasename = (() => {
  const base = import.meta.env.BASE_URL || '/'
  const trimmed = base.replace(/\/+$/, '')
  return trimmed === '' ? undefined : trimmed
})()

const router = createBrowserRouter(
  routes.map(route => {
    if (isPublicRoutePath(route.path))
      return route
    const { Component, ...rest } = route
    const GuardedComponent =
      withAuthGuard(Component)
    return {
      ...rest,
      element: <GuardedComponent />,
    }
  }),
  routerBasename
    ? { basename: routerBasename }
    : {}
)

ReactDOM.hydrateRoot(
  document.getElementById('root') as HTMLElement,
  <Provider store={store}>
    <LandingThemeProvider>
      <ThemeProvider theme="light">
        <ErrorBoundary>
          <RouterProvider router={router} />
        </ErrorBoundary>
      </ThemeProvider>
    </LandingThemeProvider>
  </Provider>
)
