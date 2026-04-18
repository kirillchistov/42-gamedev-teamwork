/**
 * Фоны экрана результата (`/game/finish`): `public/icons/bg*.jpg`.
 * Индекс в `localStorage` — после партии сдвигается, вручную: `cycleArenaBgNext()`.
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
  } catch {
    /* ignore */
  }
}

/** После завершённой партии — следующий экран результата с другим фоном. */
export function advanceArenaBgAfterGame(): void {
  cycleArenaBgNext()
}
