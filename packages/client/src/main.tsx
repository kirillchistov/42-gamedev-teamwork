import React from 'react'
import ReactDOM from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { Provider } from 'react-redux'
import { ThemeProvider } from '@gravity-ui/uikit'
import { store } from './store'
import { routes } from './routes'
import './shared/styles/normalize.pcss'
import './shared/styles/base.pcss'
import './shared/styles/landing.pcss'
import '@gravity-ui/uikit/styles/fonts.css'
import '@gravity-ui/uikit/styles/styles.css'

const router = createBrowserRouter(routes)

ReactDOM.hydrateRoot(
  document.getElementById('root') as HTMLElement,
  <Provider store={store}>
    <ThemeProvider theme="light">
      <RouterProvider router={router} />
    </ThemeProvider>
  </Provider>
)
