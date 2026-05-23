import { cancelScheduledTimeout, scheduleTimeout } from './isomorphicTimer'

/**
 * GitHub Pages: API Практикума через same-origin (Service Worker),
 * чтобы cookie сессии были first-party (Safari на iOS блокирует cross-site Set-Cookie).
 */

export const PRAKTIKUM_API_V2_ORIGIN = 'https://ya-praktikum.tech/api/v2'

/** Путь same-origin прокси: `/repo-name/api/v2` или `/api/v2` на корне. */
export function ghPagesPraktikumProxyBase(appBaseUrl: string): string {
  const trimmed = appBaseUrl.replace(/\/+$/, '')
  if (!trimmed || trimmed === '/') {
    return '/api/v2'
  }
  return `${trimmed}/api/v2`
}

/** Переписать Set-Cookie с ya-praktikum.tech под origin GitHub Pages. */
export function rewritePraktikumSetCookie(
  line: string,
  repoBasePath: string
): string {
  let out = line.trim()
  out = out.replace(/;\s*Domain=[^;]*/gi, '')
  out = out.replace(/;\s*SameSite=None/gi, '; SameSite=Lax')

  const apiPath = repoBasePath ? `${repoBasePath}/api/v2` : '/api/v2'
  out = out.replace(/;\s*Path=\/api\/v2\b/gi, `; Path=${apiPath}`)

  if (repoBasePath) {
    out = out.replace(/;\s*Path=\/$/i, `; Path=${repoBasePath}/`)
    out = out.replace(/;\s*Path=\/;/gi, `; Path=${repoBasePath}/;`)
  }

  return out
}

/** Дождаться controlling SW (прокси /api/v2) перед auth на GitHub Pages. */
export async function waitForGhPagesServiceWorker(): Promise<void> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return
  }
  try {
    await navigator.serviceWorker.ready
    if (navigator.serviceWorker.controller) {
      return
    }
    await new Promise<void>(resolve => {
      const maxWait = scheduleTimeout(() => resolve(), 4000)
      navigator.serviceWorker.addEventListener(
        'controllerchange',
        () => {
          cancelScheduledTimeout(maxWait)
          resolve()
        },
        { once: true }
      )
    })
  } catch {
    /* SW недоступен — пробуем login как есть */
  }
}

export function readSetCookieLines(headers: Headers): string[] {
  const withGetSetCookie = headers as Headers & {
    getSetCookie?: () => string[]
  }
  if (typeof withGetSetCookie.getSetCookie === 'function') {
    return withGetSetCookie.getSetCookie()
  }
  const merged = headers.get('set-cookie')
  return merged ? [merged] : []
}
