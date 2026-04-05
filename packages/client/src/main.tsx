/** Изменения и починка Sprint6 Chores:
 * Публичные маршруты: без обёртки ProtectedRoute
 **/

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
import { ProtectedRoute } from './components/ProtectedRoute'
import './shared/styles/normalize.pcss'
import './shared/styles/base.pcss'
import './shared/styles/landing.pcss'
import '@gravity-ui/uikit/styles/fonts.css'
import '@gravity-ui/uikit/styles/styles.css'
import { ErrorBoundary } from './components/ErrorBoundary'

// Публичные маршруты: без ProtectedRoute
const PUBLIC_PATHS = new Set([
  '/login',
  '/sign-in',
  '/signin',
  '/logout',
  '/signup',
  '/register',
  '*',
])

const router = createBrowserRouter(
  routes.map(route => {
    if (PUBLIC_PATHS.has(route.path ?? ''))
      return route
    const { Component, ...rest } = route
    return {
      ...rest,
      element: (
        <ProtectedRoute>
          <Component />
        </ProtectedRoute>
      ),
    }
  })
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
