// вход на сервере, экспортирует render(req) для SSR
// возвращает html, initialState, helmet, styleTags.

// 6.5 Подключил HOC withAuthGuard вместо ProtectedRoute для непубличных маршрутов
import React from 'react'
import ReactDOM from 'react-dom/server'
import { Provider } from 'react-redux'
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
import { withAuthGuard } from './hoc/withAuthGuard'
import './index.css'
import { setPageHasBeenInitializedOnServer } from './slices/ssrSlice'
import { isPublicRoutePath } from './router/publicRoutePaths'

const guardedRoutes = routes.map(route => {
  if (isPublicRoutePath(route.path)) return route
  type RouteWithComponent = typeof route & {
    Component: React.ComponentType
  }
  const { Component, ...rest } =
    route as RouteWithComponent
  const GuardedComponent =
    withAuthGuard(Component)
  return {
    ...rest,
    element: <GuardedComponent />,
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
      'Ошибка при инициализации страницы',
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
  const html = ReactDOM.renderToString(
    <Provider store={store}>
      <LandingThemeProvider>
        <StaticRouterProvider
          router={router}
          context={context}
        />
      </LandingThemeProvider>
    </Provider>
  )
  const styleTags = ''

  const helmet = Helmet.renderStatic()

  return {
    html,
    helmet,
    styleTags,
    initialState: store.getState(),
  }
}
