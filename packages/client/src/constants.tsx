import './client.d'

/** Без import.meta: Jest/ts-jest собирают в CJS и не могут выполнить import.meta в Node. */
function readAppApiUrl(): string {
  const raw = process.env.VITE_APP_API_URL
  if (raw != null && String(raw).trim() !== '') {
    return String(raw).trim().replace(/\/+$/, '')
  }
  return 'http://localhost:3000'
}

/** Базовый URL нашего Node API (friends, форум и т.д.). Переопределение: VITE_APP_API_URL. */
export const SERVER_HOST = readAppApiUrl()
export const DEFAULT_AVATAR_PATH =
  '/avatar-transp.png'
export const BASE_URL =
  'https://ya-praktikum.tech/api/v2'
export const API_RESOURCES_URL = `${BASE_URL}/resources`
