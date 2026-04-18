/**
 * Фоны экрана результата (`/game/finish`): `public/icons/bg*.jpg`.
 * Индекс в `localStorage` — после партии сдвигается, вручную: `cycleArenaBgNext()`.
 *
 * Пользовательский фон (свой URL):
 * — Сейчас хранится только в `localStorage` (ключ `MATCH3_ARENA_BG_CUSTOM_KEY`), без загрузки файлов на сервер.
 * — Подходит для демо и офлайн: `https://…` CDN-картинка или путь с этого сайта (`/icons/…`).
 * — Когда появится бэкенд / API Яндекс.Практикума для вложений в чатах, логичнее хранить там `file_id` или
 *   постоянный URL после загрузки и синхронизировать с профилем пользователя; клиент тогда подставит
 *   готовый HTTPS-URL вместо ручного ввода.
 */
export const MATCH3_ARENA_BG_URLS: readonly string[] =
  [
    '/icons/bgcosmic1.jpg',
    '/icons/bgcosmic2.jpg',
    '/icons/bgcosmic3.jpg',
    '/icons/bgcosmic4.jpg',
    '/icons/bgcosmic5.jpg',
  ]

const STORAGE_KEY = 'match3:arena-bg-index'

/** Свой URL фона (пустая строка в storage = не используется). */
export const MATCH3_ARENA_BG_CUSTOM_KEY =
  'match3:arena-bg-custom-url'

export const ARENA_BG_CHANGED_EVENT =
  'match3:arena-bg-changed' as const

export function readArenaBgIndex(): number {
  if (typeof window === 'undefined') return 0
  try {
    const raw =
      window.localStorage.getItem(STORAGE_KEY)
    if (raw == null) return 0
    const n = Number(raw)
    if (!Number.isFinite(n)) return 0
    const len = MATCH3_ARENA_BG_URLS.length
    return ((Math.floor(n) % len) + len) % len
  } catch {
    return 0
  }
}

export function arenaBgUrlForIndex(
  i: number
): string {
  const len = MATCH3_ARENA_BG_URLS.length
  if (len === 0) return ''
  const idx = ((Math.floor(i) % len) + len) % len
  return (
    MATCH3_ARENA_BG_URLS[idx] ??
    MATCH3_ARENA_BG_URLS[0]
  )
}

/**
 * Разрешённые адреса фона: `http(s):`, либо абсолютный путь с этого origin (`/…`, не `//…`).
 * Отсекаем `javascript:`, `data:` и т.п.
 */
export function isAllowedArenaPhotoHref(
  raw: string
): boolean {
  const s = raw.trim()
  if (!s || s.length > 2048) return false
  const low = s.toLowerCase()
  if (
    low.startsWith('javascript:') ||
    low.startsWith('data:') ||
    low.startsWith('vbscript:')
  ) {
    return false
  }
  if (s.startsWith('//')) return false
  if (s.startsWith('/')) {
    if (s.includes('..')) return false
    return true
  }
  try {
    const u = new URL(s)
    return (
      u.protocol === 'https:' ||
      u.protocol === 'http:'
    )
  } catch {
    return false
  }
}

export function readArenaCustomPhotoUrl(): string {
  if (typeof window === 'undefined') return ''
  try {
    const raw = window.localStorage.getItem(
      MATCH3_ARENA_BG_CUSTOM_KEY
    )
    if (raw == null) return ''
    const t = raw.trim()
    if (!t) return ''
    return isAllowedArenaPhotoHref(t) ? t : ''
  } catch {
    return ''
  }
}

/** Пресет по индексу или свой URL, если задан и валиден. */
export function readResolvedArenaPhotoUrl(): string {
  const custom = readArenaCustomPhotoUrl()
  if (custom) return custom
  return arenaBgUrlForIndex(readArenaBgIndex())
}

export function notifyArenaBgChanged(): void {
  if (typeof window === 'undefined') return
  try {
    window.dispatchEvent(
      new Event(ARENA_BG_CHANGED_EVENT)
    )
  } catch {
    /* ignore */
  }
}

/**
 * Сохранить свой URL фона. Пустая строка или невалидный URL — очистка.
 * @returns `true`, если значение сохранено или сброшено без ошибки.
 */
export function setArenaCustomPhotoUrl(
  raw: string
): boolean {
  if (typeof window === 'undefined') return false
  try {
    const t = raw.trim()
    if (!t) {
      window.localStorage.removeItem(
        MATCH3_ARENA_BG_CUSTOM_KEY
      )
      notifyArenaBgChanged()
      return true
    }
    if (!isAllowedArenaPhotoHref(t)) return false
    window.localStorage.setItem(
      MATCH3_ARENA_BG_CUSTOM_KEY,
      t
    )
    notifyArenaBgChanged()
    return true
  } catch {
    return false
  }
}

export function clearArenaCustomPhotoUrl(): void {
  setArenaCustomPhotoUrl('')
}

/** Следующий фон по кругу; обновляет `localStorage`. */
export function cycleArenaBgNext(): void {
  if (typeof window === 'undefined') return
  try {
    const len = MATCH3_ARENA_BG_URLS.length
    if (len === 0) return
    const next = (readArenaBgIndex() + 1) % len
    window.localStorage.setItem(
      STORAGE_KEY,
      String(next)
    )
    notifyArenaBgChanged()
  } catch {
    /* ignore */
  }
}

/** После завершённой партии — следующий экран результата с другим фоном. */
export function advanceArenaBgAfterGame(): void {
  cycleArenaBgNext()
}
