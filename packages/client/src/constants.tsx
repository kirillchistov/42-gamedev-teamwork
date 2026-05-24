import './client.d'
import { ghPagesPraktikumProxyBase } from './shared/ghPagesPraktikumProxy'
import { isStaticGhPagesDeploy } from './shared/staticDeploy'

const DEFAULT_NODE_API = 'http://localhost:3000'

function trimTrailingSlash(value: string): string {
  return value.replace(/\/+$/, '')
}

/** Динамический доступ — Vite `define` не подставляет литерал в бандл. */
function nodeEnv(key: string): string | undefined {
  if (typeof process === 'undefined' || !process.env) {
    return undefined
  }
  const raw = process.env[key]
  if (raw == null) return undefined
  const trimmed = String(raw).trim()
  return trimmed === '' ? undefined : trimmed
}

function isBrowserRuntime(): boolean {
  return typeof window !== 'undefined' && typeof document !== 'undefined'
}

/** Node (SSR / entry-server): прямой URL API; в Docker — INTERNAL_SERVER_URL. */
function readAppApiUrl(): string {
  const external = nodeEnv('EXTERNAL_SERVER_URL') || nodeEnv('VITE_APP_API_URL')
  const internal = nodeEnv('INTERNAL_SERVER_URL')
  const internalIsDockerOnly =
    internal != null && /:\/\/server(?::|\/|$)/.test(internal)

  if (internalIsDockerOnly) {
    if (process.env.NODE_ENV === 'development') {
      if (external) {
        return external
      }
      return DEFAULT_NODE_API
    }
    return trimTrailingSlash(internal)
  }
  if (internal) {
    return trimTrailingSlash(internal)
  }
  if (external) {
    return external
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
