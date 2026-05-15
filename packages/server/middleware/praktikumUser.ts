/**
 * Разбор тела ответа GET /auth/user Практикума (см. client shared/api/userApi).
 */
export type PraktikumUser = {
  /** Числовой id из ответа GET /auth/user Практикума (`o.id`). */
  id: number
  displayLabel: string
}

/**
 * Стабильный строковый ключ пользователя для колонок БД вида `praktikum_user_id TEXT`
 * (темизация, настройки и т.д.): всегда `String(id)` от API, без префиксов.
 * См. docs/project-themization.md §3 (Q2).
 */
export function praktikumUserIdForDb(
  user: PraktikumUser
): string {
  return String(user.id)
}

export function parsePraktikumUser(
  body: unknown
): PraktikumUser | null {
  if (body === null || typeof body !== 'object') {
    return null
  }
  const o = body as Record<string, unknown>
  const id = Number(o.id)
  if (!Number.isFinite(id)) {
    return null
  }
  const display_name =
    typeof o.display_name === 'string'
      ? o.display_name
      : typeof o.displayName === 'string'
      ? o.displayName
      : ''
  const login =
    typeof o.login === 'string' ? o.login : ''
  const displayLabel =
    (display_name && display_name.trim()) ||
    (login && login.trim()) ||
    `user-${id}`
  return { id, displayLabel }
}
