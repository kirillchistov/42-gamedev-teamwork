// Client-side plain-text валидация (forum, hero chat). Калька серверных правил по docs/xss.md

export const FORUM_TITLE_MAX_LEN = 255
export const FORUM_CONTENT_MAX_LEN = 100_000
export const FORUM_CONTENT_MIN_LEN = 1

const MARKUP_PATTERN =
  /<|>|javascript\s*:|data\s*:\s*text\/html|on\w+\s*=/i

export type PlainTextValidationResult =
  | { ok: true; value: string }
  | { ok: false; reason: string }

/** Tab, LF, CR allowed; other C0 controls and DEL removed. */
function isUnsafeControlCode(
  code: number
): boolean {
  if (code === 9 || code === 10 || code === 13) {
    return false
  }
  return code < 32 || code === 127
}

export function stripUnsafeControlChars(
  value: string
): string {
  let out = ''
  for (let i = 0; i < value.length; i += 1) {
    const code = value.charCodeAt(i)
    if (!isUnsafeControlCode(code)) {
      out += value[i]
    }
  }
  return out
}

export function containsForbiddenMarkup(
  value: string
): boolean {
  return MARKUP_PATTERN.test(value)
}

export function normalizeForumTitle(
  value: string
): string {
  return stripUnsafeControlChars(value)
    .trim()
    .replace(/\s+/g, ' ')
}

export function normalizeForumContent(
  value: string
): string {
  return stripUnsafeControlChars(value).trim()
}

// HTML escape для non-React синков (SSR snippets, tests)
export function escapeHtml(
  value: string
): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

export function validateForumTitle(
  raw: string
): PlainTextValidationResult {
  const normalized = normalizeForumTitle(raw)
  if (normalized.length < 1) {
    return {
      ok: false,
      reason: 'Укажите заголовок',
    }
  }
  if (normalized.length > FORUM_TITLE_MAX_LEN) {
    return {
      ok: false,
      reason: `Заголовок не длиннее ${FORUM_TITLE_MAX_LEN} символов`,
    }
  }
  if (containsForbiddenMarkup(normalized)) {
    return {
      ok: false,
      reason:
        'Заголовок без HTML и скриптов (символы < и > недопустимы)',
    }
  }
  return { ok: true, value: normalized }
}

export function validateForumContent(
  raw: string
): PlainTextValidationResult {
  const normalized = normalizeForumContent(raw)
  if (normalized.length < FORUM_CONTENT_MIN_LEN) {
    return {
      ok: false,
      reason: 'Введите текст сообщения',
    }
  }
  if (normalized.length > FORUM_CONTENT_MAX_LEN) {
    return {
      ok: false,
      reason: `Текст не длиннее ${FORUM_CONTENT_MAX_LEN} символов`,
    }
  }
  if (containsForbiddenMarkup(normalized)) {
    return {
      ok: false,
      reason:
        'Только обычный текст: без HTML-тегов и javascript:',
    }
  }
  return { ok: true, value: normalized }
}
