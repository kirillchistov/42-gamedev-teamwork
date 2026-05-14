import type {
  NextFunction,
  Request,
  Response,
} from 'express'

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
 */
export async function requirePraktikumAuth(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
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

    next()
  } catch {
    res
      .status(502)
      .json({ reason: 'Auth check unreachable' })
  }
}
