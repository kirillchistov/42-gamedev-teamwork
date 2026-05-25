import './client.d'
import { ghPagesPraktikumProxyBase } from './shared/ghPagesPraktikumProxy'
import { isStaticGhPagesDeploy } from './shared/staticDeploy'

const DEFAULT_PRAKTIKUM_API = 'https://ya-praktikum.tech/api/v2'
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

function readPraktikumApiBaseForNode(): string {
  const raw = nodeEnv('PRAKTIKUM_API_URL')
  if (raw) {
    const normalized = trimTrailingSlash(raw)
    if (normalized.endsWith('/api/v2')) {
      return normalized
    }
    return `${normalized}/api/v2`
  }
  return DEFAULT_PRAKTIKUM_API
}

/**
 * База Практикума (/api/v2). В браузере — same-origin (относительный путь).
 * Вызывать при запросе, не кэшировать при импорте модуля (сборка без window).
 */
export function getBaseUrl(): string {
  if (isBrowserRuntime()) {
    if (isStaticGhPagesDeploy()) {
      return ghPagesPraktikumProxyBase(
        typeof __APP_BASE_URL__ === 'string' ? __APP_BASE_URL__ : '/'
      )
    }
    return '/api/v2'
  }
  return readPraktikumApiBaseForNode()
}

/**
 * База нашего Node API (forum, friends, /api/ui).
 * В браузере — same-origin (пустая строка).
 */
export function getServerHost(): string {
  if (isBrowserRuntime()) {
    return ''
  }
  return readAppApiUrl()
}

export function getApiResourcesUrl(): string {
  return `${getBaseUrl()}/resources`
}

/** true на GitHub Pages — UI без Node API (форум, PUT /api/ui/theme). */
export const IS_STATIC_GH_PAGES_DEPLOY = isStaticGhPagesDeploy()

export const DEFAULT_AVATAR_PATH = '/avatar-transp.png'
