import React from 'react'
import ReactDOM from 'react-dom/server'
import { Provider } from 'react-redux'
import { ServerStyleSheet } from 'styled-components'
import { Helmet } from 'react-helmet'
import { Request as ExpressRequest } from 'express'
import {
  createStaticHandler,
  createStaticRouter,
  StaticRouterProvider,
} from 'react-router-dom/server'
import { matchRoutes } from 'react-router-dom'
import { configureStore } from '@reduxjs/toolkit'

import {
  createContext,
  createFetchRequest,
  createUrl,
} from './entry-server.utils'
import { LandingThemeProvider } from './contexts/LandingThemeContext'
import { reducer } from './store'
import { routes } from './routes'
import { ProtectedRoute } from './components/ProtectedRoute'
import './index.css'
import { setPageHasBeenInitializedOnServer } from './slices/ssrSlice'

const PUBLIC_PATHS = new Set([
  '/login',
  '/signup',
  '/register',
  '/signin',
  '/sign-in',
  '*',
])

const guardedRoutes = routes.map(route => {
  if (PUBLIC_PATHS.has(route.path ?? ''))
    return route
  type RouteWithComponent = typeof route & {
    Component: React.ComponentType
  }
  const { Component, ...rest } =
    route as RouteWithComponent
  return {
    ...rest,
    element: (
      <ProtectedRoute>
        <Component />
      </ProtectedRoute>
    ),
  }
})

export const render = async (
  req: ExpressRequest
) => {
  const { query, dataRoutes } =
    createStaticHandler(guardedRoutes)
  const fetchRequest = createFetchRequest(req)
  const context = await query(fetchRequest)

  if (context instanceof Response) {
    throw context
  }

  const store = configureStore({
    reducer,
  })

  const url = createUrl(req)

  const foundRoutes = matchRoutes(
    guardedRoutes,
    url
  )
  if (!foundRoutes) {
    throw new Error('Страница не найдена!')
  }

  const [
    {
      route: { fetchData },
    },
  ] = foundRoutes

  try {
    await fetchData({
      dispatch: store.dispatch,
      state: store.getState(),
      ctx: createContext(req),
    })
  } catch (e) {
    console.log(
      'Инициализация страницы произошла с ошибкой',
      e
    )
  }

  store.dispatch(
    setPageHasBeenInitializedOnServer(true)
  )

  const router = createStaticRouter(
    dataRoutes,
    context
  )
  const sheet = new ServerStyleSheet()
  try {
    const html = ReactDOM.renderToString(
      sheet.collectStyles(
        <Provider store={store}>
          <LandingThemeProvider>
            <StaticRouterProvider
              router={router}
              context={context}
            />
          </LandingThemeProvider>
        </Provider>
      )
    )
    const styleTags = sheet.getStyleTags()

    const helmet = Helmet.renderStatic()

    return {
      html,
      helmet,
      styleTags,
      initialState: store.getState(),
    }
  } finally {
    sheet.seal()
  }
}
