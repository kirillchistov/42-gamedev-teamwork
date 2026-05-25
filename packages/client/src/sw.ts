/// <reference lib="webworker" />

import type { PrecacheEntry } from './sw-env'
import {
  isPraktikumProxyPath,
  proxyPraktikumApiRequest,
} from './sw/praktikumApiProxy'

declare const self: ServiceWorkerGlobalScope & {
  __WB_MANIFEST: Array<PrecacheEntry | string>
}

const CACHE_NAME = 'match3-cache-v2'

// self.__WB_MANIFEST заменяется плагином на массив ресурсов при сборке
const PRECACHE_ENTRIES = self.__WB_MANIFEST || []

// ─── Install ────────────────────────────────────────────
// При первой загрузке кешируем все статические ресурсы
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      const urls = PRECACHE_ENTRIES.map(entry =>
        typeof entry === 'string' ? entry : entry.url
      )
      return cache.addAll(urls)
    })
  )
  self.skipWaiting()
})

// ─── Activate ───────────────────────────────────────────
// Удаляем старые версии кеша
self.addEventListener('activate', event => {
  event.waitUntil(
    caches
      .keys()
      .then(keys =>
        Promise.all(
          keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
        )
      )
  )
  self.clients.claim()
})

// ─── Fetch ──────────────────────────────────────────────
// Cache-first для статики, network-first для навигации и API
self.addEventListener('fetch', event => {
  const { request } = event
  const url = new URL(request.url)

  // GitHub Pages: same-origin /api/v2 → SW → ya-praktikum.tech (cookie first-party)
  if (
    typeof __GH_PAGES_API_PROXY__ !== 'undefined' &&
    __GH_PAGES_API_PROXY__ &&
    url.origin === self.location.origin &&
    isPraktikumProxyPath(url.pathname)
  ) {
    const appBase =
      typeof __APP_BASE_URL__ === 'string' ? __APP_BASE_URL__ : '/'
    event.respondWith(proxyPraktikumApiRequest(request, appBase))
    return
  }

  // SSR / dev: /api/* обслуживает Express, SW не трогает
  if (url.pathname.startsWith('/api/')) {
    return
  }

  // Пропускаем не-GET запросы
  if (request.method !== 'GET') {
    return
  }

  // Network-first для внешних запросов (API)
  if (url.origin !== self.location.origin) {
    event.respondWith(networkFirst(request))
    return
  }

  // Network-first для навигации (HTML-страницы)
  if (request.mode === 'navigate') {
    event.respondWith(networkFirst(request))
    return
  }

  // Cache-first для статических ресурсов (JS, CSS, изображения)
  event.respondWith(cacheFirst(request))
})

// ─── Стратегия: сначала кеш ─────────────────────────────
async function cacheFirst(request: Request): Promise<Response> {
  const cached = await caches.match(request)
  if (cached) {
    return cached
  }

  const response = await fetch(request)
  if (response.ok) {
    const cache = await caches.open(CACHE_NAME)
    cache.put(request, response.clone())
  }
  return response
}

// ─── Стратегия: сначала сеть ────────────────────────────
async function networkFirst(request: Request): Promise<Response> {
  try {
    const response = await fetch(request)
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME)
      cache.put(request, response.clone())
    }
    return response
  } catch {
    const cached = await caches.match(request)
    return cached || new Response('Offline', { status: 503 })
  }
}
