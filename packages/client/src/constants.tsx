import './client.d'

/** Без import.meta: Jest/ts-jest собирают в CJS и не могут выполнить import.meta в Node. */
function readAppApiUrl(): string {
  const raw = process.env.VITE_APP_API_URL
  if (raw != null && String(raw).trim() !== '') {
    return String(raw).trim().replace(/\/+$/, '')
  }
  return 'http://localhost:3000'
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
