// клиентский вход: 'ReactDOM.createRoot', 'Provider', 'RouterProvider' (React Router v6),
// темы, глобальные стили, ErrorBoundary / AppErrorFallback, оборачивание в 'withAuthGuard'.
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
import './shared/styles/user-shell.pcss'
import './shared/styles/match3-theme.pcss'
import './shared/styles/responsive.pcss'
import './shared/styles/forum.pcss'
import '@gravity-ui/uikit/styles/fonts.css'
import '@gravity-ui/uikit/styles/styles.css'
import { ErrorBoundary } from './components/ErrorBoundary'
import { AppErrorFallback } from './components/AppErrorFallback'
import { isPublicRoutePath } from './router/publicRoutePaths'

const routerBasename = (() => {
  const base = import.meta.env.BASE_URL || '/'
  const trimmed = base.replace(/\/+$/, '')
  return trimmed === '' ? undefined : trimmed
})()

const router = createBrowserRouter(
  routes.map(route => {
    const commonErrorElement = (
      <AppErrorFallback />
    )

    if (isPublicRoutePath(route.path))
      return {
        ...route,
        errorElement: commonErrorElement,
      }
    const { Component, ...rest } = route
    const GuardedComponent =
      withAuthGuard(Component)
    return {
      ...rest,
      element: <GuardedComponent />,
      errorElement: commonErrorElement,
    }
  }),
  routerBasename
    ? { basename: routerBasename }
    : {}
)

const rootElement = document.getElementById(
  'root'
) as HTMLElement

const app = (
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

/** Статический деплой (GitHub Pages): в `#root` нет HTML от `renderToString`, только плейсхолдер SSR. */
const canHydrate =
  rootElement.firstElementChild != null

if (canHydrate) {
  ReactDOM.hydrateRoot(rootElement, app)
} else {
  ReactDOM.createRoot(rootElement).render(app)
}
