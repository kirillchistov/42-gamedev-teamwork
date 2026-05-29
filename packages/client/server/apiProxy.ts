/**
 * Same-origin прокси: браузер шлёт Cookie сессии Практикума на origin клиента,
 * SSR-сервер пробрасывает их в ya-praktikum.tech и packages/server.
 */
import type { Express } from 'express'
import { createProxyMiddleware, type Options } from 'http-proxy-middleware'

const DEFAULT_PRAKTIKUM_ORIGIN = 'https://ya-praktikum.tech'
const DEFAULT_NODE_API = 'http://localhost:3000'

function trimTrailingSlash(value: string): string {
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

function readDevNodeApiTarget(): string {
  const explicit = process.env.DEV_NODE_API_URL?.trim()
  if (explicit) {
    return trimTrailingSlash(explicit)
  }
  const port = process.env.SERVER_PORT?.trim() || '3000'
  return `http://localhost:${port}`
}

function readNodeApiTarget(): string {
  const external =
    process.env.EXTERNAL_SERVER_URL?.trim() ||
    process.env.VITE_APP_API_URL?.trim()
  const internal = process.env.INTERNAL_SERVER_URL?.trim()

  // В dev на хосте INTERNAL_SERVER_URL=http://server:… из docker-compose не резолвится.
  const internalIsDockerOnly =
    internal != null && /:\/\/server(?::|\/|$)/.test(internal)

  if (process.env.NODE_ENV === 'development') {
    if (internalIsDockerOnly) {
      return readDevNodeApiTarget()
    }
    // .env с SERVER_PORT=3001 для ВМ/Docker — локальный yarn dev:server слушает 3000.
    if (external && /:\/\/(localhost|127\.0\.0\.1):3001\b/.test(external)) {
      return readDevNodeApiTarget()
    }
  }

  if (
    process.env.NODE_ENV === 'development' &&
    internalIsDockerOnly &&
    external
  ) {
    return trimTrailingSlash(external)
  }
  if (internal) {
    return trimTrailingSlash(internal)
  }
  if (external) {
    return trimTrailingSlash(external)
  }
  return DEFAULT_NODE_API
}

const sharedProxyOptions: Pick<
  Options,
  'changeOrigin' | 'cookieDomainRewrite' | 'cookiePathRewrite'
> = {
  changeOrigin: true,
  cookieDomainRewrite: {
    'ya-praktikum.tech': '',
    '.ya-praktikum.tech': '',
  },
  cookiePathRewrite: {
    '/api/v2': '/api/v2',
    '/': '/',
  },
}

function nodeProxy(nodeApiTarget: string, mountPath: string) {
  const base = trimTrailingSlash(nodeApiTarget)
  const prefix = mountPath.startsWith('/') ? mountPath : `/${mountPath}`
  return createProxyMiddleware({
    // http-proxy-middleware v3: target должен включать тот же base path, что и app.use(path).
    target: `${base}${prefix}`,
    changeOrigin: true,
    proxyTimeout: 30_000,
    timeout: 30_000,
  })
}

export function registerApiProxy(app: Express): void {
  const praktikumOrigin = readPraktikumOrigin()
  const nodeApiTarget = readNodeApiTarget()
  if (process.env.NODE_ENV === 'development') {
    console.log(
      `[apiProxy] Node API → ${nodeApiTarget} (forum, friends, /user)`
    )
  }

  app.use(
    '/api/v2',
    createProxyMiddleware({
      target: `${praktikumOrigin}/api/v2`,
      ...sharedProxyOptions,
      secure: true,
    })
  )

  app.use('/api/forum', nodeProxy(nodeApiTarget, '/api/forum'))
  app.use('/api/ui', nodeProxy(nodeApiTarget, '/api/ui'))
  app.use('/friends', nodeProxy(nodeApiTarget, '/friends'))
  app.use('/user', nodeProxy(nodeApiTarget, '/user'))
}
