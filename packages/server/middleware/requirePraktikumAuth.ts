import type {
  NextFunction,
  Request,
  Response,
} from 'express'
import { resolvePraktikumUser } from './resolvePraktikumUser'

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
  const result = await resolvePraktikumUser(req)

  if (result.ok) {
    req.praktikumUser = result.user
    next()
    return
  }

  if (result.reason === 'unreachable') {
    res
      .status(502)
      .json({ reason: 'Auth check unreachable' })
    return
  }

  res.status(403).json({ reason: 'Forbidden' })
}
