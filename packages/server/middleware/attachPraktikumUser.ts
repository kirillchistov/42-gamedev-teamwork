import type {
  NextFunction,
  Request,
  Response,
} from 'express'
import { resolvePraktikumUser } from './resolvePraktikumUser'

/**
 * Проверка сессии: успехе -> 'req.praktikumUser', нет -> 'next()'.
 * Для публичных ручек с гостем ('/api/ui/theme').
 */
export async function attachPraktikumUser(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  const result = await resolvePraktikumUser(req)
  if (result.ok) {
    req.praktikumUser = result.user
  }
  next()
}
