import './client.d'
import { ghPagesPraktikumProxyBase } from './shared/ghPagesPraktikumProxy'
import { isStaticGhPagesDeploy } from './shared/staticDeploy'

const DEFAULT_PRAKTIKUM_API =
  'https://ya-praktikum.tech/api/v2'
const DEFAULT_NODE_API = 'http://localhost:3000'

function trimTrailingSlash(
  value: string
): string {
  return value.replace(/\/+$/, '')
}

/** В браузере API идёт через same-origin прокси SSR-сервера (см. server/apiProxy.ts). */
function isBrowserBundle(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof document !== 'undefined'
  )
}

/** Без import.meta: Jest/ts-jest собирают в CJS и не могут выполнить import.meta в Node. */
function readAppApiUrl(): string {
  if (isBrowserBundle()) {
    return ''
  }
  const raw = process.env.VITE_APP_API_URL
  if (raw != null && String(raw).trim() !== '') {
    return trimTrailingSlash(String(raw))
  }
  return DEFAULT_NODE_API
}

function readPraktikumApiBase(): string {
  if (isBrowserBundle()) {
    if (isStaticGhPagesDeploy()) {
      return ghPagesPraktikumProxyBase(
        typeof __APP_BASE_URL__ === 'string'
          ? __APP_BASE_URL__
          : '/'
      )
    }
    return '/api/v2'
  }
  const raw =
    process.env.PRAKTIKUM_API_URL?.trim()
  if (raw) {
    const normalized = trimTrailingSlash(raw)
    if (normalized.endsWith('/api/v2')) {
      return normalized
    }
    return `${normalized}/api/v2`
  }
  return DEFAULT_PRAKTIKUM_API
}

const isBrowser = typeof window !== 'undefined'

/**
 * Базовый URL нашего Node API (friends, форум, /api/ui).
 * В браузере на SSR — same-origin (пустая строка), запросы идут через apiProxy.
 * На GitHub Pages — пусто: форум/темы на Node без отдельного бэкенда недоступны.
 */
export const SERVER_HOST = isBrowser
  ? ''
  : readAppApiUrl()

export const DEFAULT_AVATAR_PATH =
  '/avatar-transp.png'

/** Практикум: прокси /api/v2 локально; на GH Pages — прямой origin. */
export const BASE_URL = readPraktikumApiBase()

export const API_RESOURCES_URL = `${BASE_URL}/resources`

/** true на GitHub Pages — UI без Node API (форум, PUT /api/ui/theme). */
export const IS_STATIC_GH_PAGES_DEPLOY =
  isStaticGhPagesDeploy()
