import './client.d'

function readAppApiUrl(): string {
  const fromEnv =
    typeof import.meta !== 'undefined' &&
    import.meta.env?.VITE_APP_API_URL != null &&
    String(
      import.meta.env.VITE_APP_API_URL
    ).trim() !== ''
      ? String(
          import.meta.env.VITE_APP_API_URL
        ).trim()
      : ''
  if (fromEnv) {
    return fromEnv.replace(/\/+$/, '')
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
