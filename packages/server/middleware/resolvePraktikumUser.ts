import type { Request } from 'express'
import {
  getLocalBypassPraktikumUser,
  isLocalPraktikumAuthBypassEnabled,
} from './localPraktikumAuthBypass'
import {
  parsePraktikumUser,
  type PraktikumUser,
} from './praktikumUser'

const DEFAULT_PRAKTIKUM_API =
  'https://ya-praktikum.tech/api/v2'

function praktikumApiBase(): string {
  const raw =
    process.env.PRAKTIKUM_API_URL?.trim()
  if (!raw) {
    return DEFAULT_PRAKTIKUM_API
  }
  const normalized = raw.replace(/\/+$/, '')
  if (normalized.endsWith('/api/v2')) {
    return normalized
  }
  return `${normalized}/api/v2`
}

export type ResolvePraktikumUserResult =
  | { ok: true; user: PraktikumUser }
  | { ok: false; reason: 'no_cookie' | 'invalid' }
  | { ok: false; reason: 'unreachable' }

/**
 * Проверка cookie-сессии Практикума (GET /auth/user), без ответа клиенту.
 * Используется в requirePraktikumAuth и attachPraktikumUser.
 */
export async function resolvePraktikumUser(
  req: Request
): Promise<ResolvePraktikumUserResult> {
  if (isLocalPraktikumAuthBypassEnabled()) {
    return {
      ok: true,
      user: getLocalBypassPraktikumUser(),
    }
  }

  const cookie = req.headers.cookie
  if (!cookie) {
    return { ok: false, reason: 'no_cookie' }
  }

  try {
    const r = await fetch(
      `${praktikumApiBase()}/auth/user`,
      {
        method: 'GET',
        headers: { cookie },
      }
    )

    if (!r.ok) {
      return { ok: false, reason: 'invalid' }
    }

    let body: unknown
    try {
      body = await r.json()
    } catch {
      return { ok: false, reason: 'invalid' }
    }

    const user = parsePraktikumUser(body)
    if (!user) {
      return { ok: false, reason: 'invalid' }
    }

    return { ok: true, user }
  } catch {
    return { ok: false, reason: 'unreachable' }
  }
}
