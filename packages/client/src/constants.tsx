import './client.d'

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
    return '/api/v2'
  }
  const raw =
    process.env.PRAKTIKUM_API_URL?.trim()
  if (raw) {
    return trimTrailingSlash(raw)
  }
  return DEFAULT_PRAKTIKUM_API
}

/** Базовый URL нашего Node API (friends, форум). В браузере — относительный путь. */
export const SERVER_HOST = readAppApiUrl()
export const DEFAULT_AVATAR_PATH =
  '/avatar-transp.png'
export const BASE_URL = readPraktikumApiBase()
export const API_RESOURCES_URL = `${BASE_URL}/resources`
