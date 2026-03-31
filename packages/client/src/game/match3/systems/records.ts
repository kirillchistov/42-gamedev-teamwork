const KEY_PLAYER = 'match3:playerRecord'
const KEY_DAILY_PREFIX = 'match3:dailyRecord:'

function todayKey(): string {
  const d = new Date()
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(
    2,
    '0'
  )
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

function readNumber(key: string): number {
  try {
    const raw = window.localStorage.getItem(key)
    if (raw == null) return 0
    const n = Number(raw)
    return Number.isFinite(n) && n >= 0 ? n : 0
  } catch (error) {
    console.warn(
      '[match3] localStorage read failed',
      error
    )
    return 0
  }
}

function writeNumber(
  key: string,
  value: number
): void {
  try {
    window.localStorage.setItem(
      key,
      String(value)
    )
  } catch (error) {
    console.warn(
      '[match3] localStorage write failed',
      error
    )
  }
}

export function loadPlayerRecord(): number {
  return readNumber(KEY_PLAYER)
}

export function updatePlayerRecord(
  score: number
): number {
  const prev = loadPlayerRecord()
  const next = Math.max(
    prev,
    Number.isFinite(score) ? score : 0
  )
  writeNumber(KEY_PLAYER, next)
  return next
}

export function clearPlayerRecord(): void {
  try {
    window.localStorage.removeItem(KEY_PLAYER)
  } catch (error) {
    console.warn(
      '[match3] localStorage remove failed',
      error
    )
  }
}

export function loadDailyRecord(): number {
  return readNumber(
    `${KEY_DAILY_PREFIX}${todayKey()}`
  )
}

export function updateDailyRecord(
  score: number
): number {
  const key = `${KEY_DAILY_PREFIX}${todayKey()}`
  const prev = readNumber(key)
  const next = Math.max(
    prev,
    Number.isFinite(score) ? score : 0
  )
  writeNumber(key, next)
  return next
}
