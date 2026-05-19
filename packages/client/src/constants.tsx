import './client.d'

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

const isBrowser = typeof window !== 'undefined'

/**
 * Базовый URL нашего Node API (friends, форум).
 * В браузере — same-origin (пустая строка), запросы идут через SSR apiProxy.
 * На SSR — VITE_APP_API_URL или localhost:3000.
 */
export const SERVER_HOST = isBrowser
  ? ''
  : readAppApiUrl()

export const DEFAULT_AVATAR_PATH =
  '/avatar-transp.png'

/** Практикум: в браузере — /api/v2 через прокси клиента; на SSR — прямой origin. */
export const BASE_URL = isBrowser
  ? '/api/v2'
  : 'https://ya-praktikum.tech/api/v2'

export const API_RESOURCES_URL = `${BASE_URL}/resources`
