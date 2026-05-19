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
  return raw && raw.length > 0
    ? raw.replace(/\/+$/, '')
    : DEFAULT_PRAKTIKUM_API
}

export type ResolvePraktikumUserResult =
  | { ok: true; user: PraktikumUser }
  | { ok: false; reason: 'no_cookie' | 'invalid' }
  | { ok: false; reason: 'unreachable' }

/**
 * Опциональная проверка сессии Практикума (без ответа клиенту).
 * Для attachPraktikumUser и requirePraktikumAuth.
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
