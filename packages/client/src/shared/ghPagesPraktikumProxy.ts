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

const GH_PAGES_SW_RELOAD_KEY = 'cosmic-match:gh-pages-sw-reload'

function ghPagesServiceWorkerUrls(): { swUrl: string; scope: string } {
  const base = typeof __APP_BASE_URL__ === 'string' ? __APP_BASE_URL__ : '/'
  const scope = base.endsWith('/') ? base : `${base}/`
  return { swUrl: `${scope}sw.js`, scope }
}

async function waitForServiceWorkerController(
  timeoutMs: number
): Promise<void> {
  if (navigator.serviceWorker.controller) {
    return
  }
  await new Promise<void>(resolve => {
    const maxWait = scheduleTimeout(() => resolve(), timeoutMs)
    navigator.serviceWorker.addEventListener(
      'controllerchange',
      () => {
        cancelScheduledTimeout(maxWait)
        resolve()
      },
      { once: true }
    )
  })
}

/**
 * GitHub Pages: зарегистрировать SW до React и любых /api/v2 fetch.
 * После первой установки без controller — один reload (стандартный паттерн PWA).
 */
export async function bootstrapGhPagesApiProxy(): Promise<void> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return
  }
  try {
    const { swUrl, scope } = ghPagesServiceWorkerUrls()
    await navigator.serviceWorker.register(swUrl, { scope })
    await navigator.serviceWorker.ready
    if (navigator.serviceWorker.controller) {
      return
    }
    await waitForServiceWorkerController(8000)
    if (navigator.serviceWorker.controller) {
      return
    }
    if (!sessionStorage.getItem(GH_PAGES_SW_RELOAD_KEY)) {
      sessionStorage.setItem(GH_PAGES_SW_RELOAD_KEY, '1')
      window.location.reload()
      return
    }
  } catch {
    /* SW недоступен */
  }
}

/** Дождаться controlling SW (прокси /api/v2) перед auth на GitHub Pages. */
export async function waitForGhPagesServiceWorker(): Promise<void> {
  await bootstrapGhPagesApiProxy()
}

export function isGhPagesApiProxyActive(): boolean {
  return (
    typeof navigator !== 'undefined' &&
    'serviceWorker' in navigator &&
    navigator.serviceWorker.controller != null
  )
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
