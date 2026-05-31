/**
 * Разбор тел ответов API и человекочитаемые тексты ошибок для UI.
 */

export function parseJsonReasonFromText(text: string): string {
  const t = text.trim()
  if (!t) return ''
  try {
    const j = JSON.parse(t) as { reason?: string }
    if (typeof j.reason === 'string') {
      return j.reason
    }
  } catch {
    /* не JSON */
  }
  return t
}

export function humanizePraktikumAuthReason(reason: string): string {
  const r = reason.trim()
  if (!r) return r

  const low = r.toLowerCase()
  if (
    low.includes('user already in system') ||
    low.includes('already in system')
  ) {
    return 'Вы уже вошли в системе. Выйдите из аккаунта и повторите вход.'
  }

  if (low.includes('cookie is not valid')) {
    return 'Сессия устарела. Очистите cookie для сайта или откройте вкладку инкognito и войдите снова.'
  }

  return r
}
