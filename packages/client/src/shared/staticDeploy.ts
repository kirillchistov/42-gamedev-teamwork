/** GitHub Pages и другой статический хостинг без Express apiProxy. */

/** Без import.meta: Jest/ts-jest (CJS) не поддерживают import.meta в Node. */
function readEnv(name: string): string {
  if (typeof process === 'undefined' || !process.env) {
    return ''
  }
  const raw = process.env[name]
  return raw != null ? String(raw).trim() : ''
}

function isBrowserBundle(): boolean {
  return typeof window !== 'undefined' && typeof document !== 'undefined'
}

export function isStaticGhPagesDeploy(): boolean {
  if (!isBrowserBundle()) {
    return false
  }
  return process.env.VITE_STATIC_DEPLOY === 'gh-pages'
}

/** Публичные auth-маршруты: isAuthChecked без user — нормальное состояние. */
export const AUTH_SHELL_PATHS = new Set([
  '/login',
  '/sign-in',
  '/signin',
  '/logout',
  '/signup',
  '/register',
  '/oauth/yandex/callback',
])

function readAppBasePath(): string {
  if (isBrowserBundle()) {
    if (typeof __APP_BASE_URL__ === 'string' && __APP_BASE_URL__) {
      return __APP_BASE_URL__.replace(/\/+$/, '') || '/'
    }
  }
  const fromPages = readEnv('GITHUB_PAGES_BASE_URL')
  if (fromPages) {
    return fromPages.replace(/\/+$/, '') || '/'
  }
  return '/'
}

export function normalizeAppPath(pathname: string): string {
  const base = readAppBasePath().replace(/\/+$/, '')
  const path = pathname.replace(/\/+$/, '') || '/'
  if (base && base !== '/' && (path === base || path.startsWith(`${base}/`))) {
    const stripped = path.slice(base.length)
    return stripped === '' ? '/' : stripped
  }
  return path
}

export function isAuthShellPath(pathname: string): boolean {
  return AUTH_SHELL_PATHS.has(normalizeAppPath(pathname))
}

export function getBrowserPathname(): string {
  if (typeof window === 'undefined') {
    return '/'
  }
  return normalizeAppPath(window.location.pathname)
}
