import type {
  NextFunction,
  Request,
  Response,
} from 'express'
import {
  getLocalBypassPraktikumUser,
  isLocalPraktikumAuthBypassEnabled,
} from './localPraktikumAuthBypass'
import { parsePraktikumUser } from './praktikumUser'

const DEFAULT_PRAKTIKUM_API =
  'https://ya-praktikum.tech/api/v2'

function praktikumApiBase(): string {
  const raw =
    process.env.PRAKTIKUM_API_URL?.trim()
  return raw && raw.length > 0
    ? raw.replace(/\/+$/, '')
    : DEFAULT_PRAKTIKUM_API
}

/**
 * Проверка сессии на API Практикума по cookie запроса.
 * Для защищённых ручек локального сервера — авторизация на бэкенде, не по флагу клиента.
 * 403 при отсутствии/невалидной сессии (единый контракт с ТЗ форума; см. docs/forum-api-spec.md §10).
 * При успехе — `req.praktikumUser` (id + строка для UI) для форума и др.
 *
 * Локальные e2e без Практикума: `LOCAL_PRAKTIKUM_AUTH_BYPASS=1` при
 * `NODE_ENV !== 'production'` — см. `localPraktikumAuthBypass.ts`.
 */
export async function requirePraktikumAuth(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  if (isLocalPraktikumAuthBypassEnabled()) {
    req.praktikumUser =
      getLocalBypassPraktikumUser()
    next()
    return
  }

  const cookie = req.headers.cookie
  if (!cookie) {
    res.status(403).json({ reason: 'Forbidden' })
    return
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
      res
        .status(403)
        .json({ reason: 'Forbidden' })
      return
    }

    let body: unknown
    try {
      body = await r.json()
    } catch {
      res
        .status(403)
        .json({ reason: 'Forbidden' })
      return
    }

    const user = parsePraktikumUser(body)
    if (!user) {
      res
        .status(403)
        .json({ reason: 'Forbidden' })
      return
    }

    req.praktikumUser = user
    next()
  } catch {
    res
      .status(502)
      .json({ reason: 'Auth check unreachable' })
  }
}
