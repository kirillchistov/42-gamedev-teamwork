/**
 * Same-origin прокси: браузер шлёт Cookie сессии Практикума на origin клиента,
 * SSR-сервер пробрасывает их в ya-praktikum.tech и packages/server.
 */
import type { Express } from 'express'
import {
  createProxyMiddleware,
  type Options,
} from 'http-proxy-middleware'

const DEFAULT_PRAKTIKUM_ORIGIN =
  'https://ya-praktikum.tech'
const DEFAULT_NODE_API = 'http://localhost:3000'

function trimTrailingSlash(
  value: string
): string {
  return value.replace(/\/+$/, '')
}

function readPraktikumOrigin(): string {
  const raw =
    process.env.PRAKTIKUM_API_URL?.trim() ||
    process.env.PRAKTIKUM_ORIGIN?.trim()
  if (!raw) {
    return DEFAULT_PRAKTIKUM_ORIGIN
  }
  const normalized = trimTrailingSlash(raw)
  if (normalized.endsWith('/api/v2')) {
    return normalized.slice(0, -'/api/v2'.length)
  }
  return normalized
}

function readNodeApiTarget(): string {
  const internal =
    process.env.INTERNAL_SERVER_URL?.trim()
  if (internal) {
    return trimTrailingSlash(internal)
  }
  const external =
    process.env.EXTERNAL_SERVER_URL?.trim() ||
    process.env.VITE_APP_API_URL?.trim()
  if (external) {
    return trimTrailingSlash(external)
  }
  return DEFAULT_NODE_API
}

const sharedProxyOptions: Pick<
  Options,
  | 'changeOrigin'
  | 'cookieDomainRewrite'
  | 'cookiePathRewrite'
> = {
  changeOrigin: true,
  cookieDomainRewrite: {
    'ya-praktikum.tech': '',
    '.ya-praktikum.tech': '',
  },
  cookiePathRewrite: {
    '/api/v2': '/api/v2',
  },
}

export function registerApiProxy(
  app: Express
): void {
  const praktikumOrigin = readPraktikumOrigin()
  const nodeApiTarget = readNodeApiTarget()

  app.use(
    '/api/v2',
    createProxyMiddleware({
      target: praktikumOrigin,
      ...sharedProxyOptions,
      secure: true,
    })
  )

  const nodeApiProxy = createProxyMiddleware({
    target: nodeApiTarget,
    changeOrigin: true,
  })

  app.use('/api/forum', nodeApiProxy)
  app.use('/api/ui', nodeApiProxy)
  app.use('/friends', nodeApiProxy)
  app.use('/user', nodeApiProxy)
}
