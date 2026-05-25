/// <reference lib="webworker" />

import {
  PRAKTIKUM_API_V2_ORIGIN,
  readSetCookieLines,
  rewritePraktikumSetCookie,
} from '../shared/ghPagesPraktikumProxy'

function repoBaseFromAppBase(appBaseUrl: string): string {
  return appBaseUrl.replace(/\/+$/, '') || ''
}

export function isPraktikumProxyPath(pathname: string): boolean {
  return pathname.includes('/api/v2')
}

export async function proxyPraktikumApiRequest(
  request: Request,
  appBaseUrl: string
): Promise<Response> {
  const url = new URL(request.url)
  const marker = '/api/v2'
  const idx = url.pathname.indexOf(marker)
  const suffix = idx >= 0 ? url.pathname.slice(idx + marker.length) : ''
  const target = `${PRAKTIKUM_API_V2_ORIGIN}${suffix}${url.search}`

  const headers = new Headers(request.headers)
  headers.delete('host')

  const init: RequestInit = {
    method: request.method,
    headers,
    redirect: 'follow',
  }
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    init.body = await request.arrayBuffer()
  }

  const upstream = await fetch(target, init)
  const repoBase = repoBaseFromAppBase(appBaseUrl)
  const outHeaders = new Headers(upstream.headers)
  outHeaders.delete('set-cookie')

  for (const line of readSetCookieLines(upstream.headers)) {
    outHeaders.append('set-cookie', rewritePraktikumSetCookie(line, repoBase))
  }

  return new Response(upstream.body, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers: outHeaders,
  })
}
