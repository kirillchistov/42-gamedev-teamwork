/**
 * Разбор тел ответов API и человекочитаемые тексты ошибок для UI (RU).
 */

type ReasonRule = {
  test: (low: string) => boolean
  message: string
}

function isMostlyCyrillic(text: string): boolean {
  const letters = text.replace(/[^\p{L}]/gu, '')
  if (!letters) return false
  const cyrillic = letters.replace(/[^\p{Script=Cyrillic}]/gu, '')
  return cyrillic.length / letters.length >= 0.5
}

function looksLikeEnglish(text: string): boolean {
  return /[a-z]/i.test(text) && !isMostlyCyrillic(text)
}

const AUTH_REASON_RULES: ReasonRule[] = [
  {
    test: low =>
      low.includes('login or password is incorrect') ||
      low.includes('login and password is incorrect') ||
      low.includes('incorrect login or password') ||
      low.includes('incorrect username or password') ||
      low.includes('invalid login credentials') ||
      low.includes('wrong login or password') ||
      low.includes('wrong password') ||
      low.includes('invalid password'),
    message: 'Неверный логин или пароль',
  },
  {
    test: low =>
      low === 'unauthorized' ||
      low.includes('not authorized') ||
      low.includes('не авторизован'),
    message: 'Неверный логин или пароль',
  },
  {
    test: low =>
      low.includes('user already in system') ||
      low.includes('already in system') ||
      low.includes('already logged'),
    message: 'Вы уже вошли в системе. Выйдите из аккаунта и повторите вход.',
  },
  {
    test: low => low.includes('cookie is not valid'),
    message:
      'Сессия устарела. Очистите cookie для сайта или откройте вкладку инкognito и войдите снова.',
  },
  {
    test: low =>
      low.includes('login already exists') ||
      low.includes('user already exists') ||
      low.includes('already exists'),
    message: 'Пользователь с такими данными уже зарегистрирован.',
  },
  {
    test: low => low.includes('email already exists'),
    message: 'Этот email уже используется.',
  },
  {
    test: low => low.includes('phone already exists'),
    message: 'Этот телефон уже используется.',
  },
  {
    test: low => low.includes('invalid email'),
    message: 'Некорректный email.',
  },
  {
    test: low => low.includes('invalid phone'),
    message: 'Некорректный телефон.',
  },
  {
    test: low =>
      low.includes('validation failed') || low.includes('invalid body'),
    message: 'Проверьте введённые данные.',
  },
]

const API_REASON_RULES: ReasonRule[] = [
  {
    test: low => low === 'forbidden',
    message: 'Доступ запрещён. Войдите в аккаунт.',
  },
  {
    test: low => low === 'not found',
    message: 'Не найдено.',
  },
  {
    test: low => low === 'internal error',
    message: 'Внутренняя ошибка сервера.',
  },
  {
    test: low => low.includes('auth check unreachable'),
    message: 'Сервис авторизации недоступен. Попробуйте позже.',
  },
  {
    test: low => low.includes('not author or moderator'),
    message: 'Недостаточно прав для этого действия.',
  },
  {
    test: low => low.includes('invalid emoji'),
    message: 'Недопустимая реакция.',
  },
  {
    test: low => low.includes('invalid parentcommentid'),
    message: 'Некорректный комментарий для ответа.',
  },
  {
    test: low => low.includes('empty patch'),
    message: 'Нечего сохранить: изменения не указаны.',
  },
]

function applyReasonRules(
  reason: string,
  rules: ReasonRule[],
  fallback: string
): string {
  const trimmed = reason.trim()
  if (!trimmed) return fallback
  if (isMostlyCyrillic(trimmed)) return trimmed

  const low = trimmed.toLowerCase()
  for (const rule of rules) {
    if (rule.test(low)) return rule.message
  }

  if (looksLikeEnglish(trimmed)) {
    return fallback
  }

  return trimmed
}

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
  return applyReasonRules(reason, AUTH_REASON_RULES, 'Ошибка авторизации.')
}

export function humanizeApiReason(
  reason: string,
  fallback = 'Не удалось выполнить запрос. Попробуйте позже.'
): string {
  const trimmed = reason.trim()
  if (!trimmed) return fallback

  const authMessage = applyReasonRules(trimmed, AUTH_REASON_RULES, trimmed)
  if (authMessage !== trimmed) return authMessage

  return applyReasonRules(trimmed, API_REASON_RULES, fallback)
}
