// Plain-text user content (forum, comments). No HTML — stored and shown as text по docs/xss.md

export const FORUM_TITLE_MAX_LEN = 255
export const FORUM_CONTENT_MAX_LEN = 100_000
export const FORUM_CONTENT_MIN_LEN = 1

const MARKUP_PATTERN = /<|>|javascript\s*:|data\s*:\s*text\/html|on\w+\s*=/i

export type PlainTextValidationResult =
  | { ok: true; value: string }
  | { ok: false; reason: string }

/** Tab, LF, CR allowed; other C0 controls and DEL removed. */
function isUnsafeControlCode(code: number): boolean {
  if (code === 9 || code === 10 || code === 13) {
    return false
  }
  return code < 32 || code === 127
}

export function stripUnsafeControlChars(value: string): string {
  let out = ''
  for (let i = 0; i < value.length; i += 1) {
    const code = value.charCodeAt(i)
    if (!isUnsafeControlCode(code)) {
      out += value[i]
    }
  }
  return out
}

export function containsForbiddenMarkup(value: string): boolean {
  return MARKUP_PATTERN.test(value)
}

export function normalizeForumTitle(value: string): string {
  return stripUnsafeControlChars(value).trim().replace(/\s+/g, ' ')
}

export function normalizeForumContent(value: string): string {
  return stripUnsafeControlChars(value).trim()
}

export function validateForumTitle(raw: string): PlainTextValidationResult {
  const normalized = normalizeForumTitle(raw)
  if (normalized.length < 1) {
    return {
      ok: false,
      reason: 'Title is required',
    }
  }
  if (normalized.length > FORUM_TITLE_MAX_LEN) {
    return {
      ok: false,
      reason: `Title must be at most ${FORUM_TITLE_MAX_LEN} characters`,
    }
  }
  if (containsForbiddenMarkup(normalized)) {
    return {
      ok: false,
      reason: 'Title must not contain HTML or scripts',
    }
  }
  return { ok: true, value: normalized }
}

export function validateForumContent(raw: string): PlainTextValidationResult {
  const normalized = normalizeForumContent(raw)
  if (normalized.length < FORUM_CONTENT_MIN_LEN) {
    return {
      ok: false,
      reason: 'Content is required',
    }
  }
  if (normalized.length > FORUM_CONTENT_MAX_LEN) {
    return {
      ok: false,
      reason: `Content must be at most ${FORUM_CONTENT_MAX_LEN} characters`,
    }
  }
  if (containsForbiddenMarkup(normalized)) {
    return {
      ok: false,
      reason: 'Content must not contain HTML tags or script handlers',
    }
  }
  return { ok: true, value: normalized }
}
