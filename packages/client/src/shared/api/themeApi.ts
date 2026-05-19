import { SERVER_HOST } from '../../constants'
import type { LandingTheme } from '../landingTheme'

export class ThemeApiError extends Error {
  readonly status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'ThemeApiError'
    this.status = status
  }
}

function themeUrl(path: string): string {
  const base = SERVER_HOST.replace(/\/+$/, '')
  const p = path.startsWith('/')
    ? path
    : `/${path}`
  return `${base}${p}`
}

async function themeRequest<T>(
  path: string,
  init?: RequestInit
): Promise<T> {
  const hasJsonBody =
    typeof init?.body === 'string' &&
    init.body.length > 0

  const res = await fetch(themeUrl(path), {
    ...init,
    credentials: 'include',
    headers: {
      ...(init?.headers ?? {}),
      ...(hasJsonBody
        ? { 'Content-Type': 'application/json' }
        : {}),
    },
  })

  const text = await res.text()
  let body: unknown = null
  if (text) {
    try {
      body = JSON.parse(text) as unknown
    } catch {
      body = null
    }
  }

  if (!res.ok) {
    const reason =
      body &&
      typeof body === 'object' &&
      body !== null &&
      'reason' in body &&
      typeof (body as { reason: unknown })
        .reason === 'string'
        ? (body as { reason: string }).reason
        : res.statusText || 'Ошибка запроса'
    throw new ThemeApiError(reason, res.status)
  }

  return body as T
}

export type ThemeResponse = {
  theme: LandingTheme
}

export async function themeGet(): Promise<ThemeResponse> {
  return themeRequest<ThemeResponse>(
    '/api/ui/theme'
  )
}

export async function themePut(
  theme: LandingTheme
): Promise<ThemeResponse> {
  return themeRequest<ThemeResponse>(
    '/api/ui/theme',
    {
      method: 'PUT',
      body: JSON.stringify({ theme }),
    }
  )
}
