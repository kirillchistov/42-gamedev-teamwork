/** Дата рекорда в API лидерборда: ISO 8601, только дата (YYYY-MM-DD). */

const ISO_DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/
const RU_DATE_RE =
  /^(\d{1,2})\.(\d{1,2})\.(\d{4})$/

function pad2(n: number): string {
  return String(n).padStart(2, '0')
}

function isValidYmd(
  y: number,
  m: number,
  d: number
): boolean {
  if (m < 1 || m > 12 || d < 1) return false
  const dt = new Date(Date.UTC(y, m - 1, d))
  return (
    dt.getUTCFullYear() === y &&
    dt.getUTCMonth() === m - 1 &&
    dt.getUTCDate() === d
  )
}

/** Приводит произвольную строку из API к YYYY-MM-DD или ''. */
export function normalizeLeaderboardRecordDate(
  raw: string
): string {
  const trimmed = raw.trim()
  if (!trimmed) return ''

  const iso = ISO_DATE_RE.exec(trimmed)
  if (iso) {
    const y = Number(iso[1])
    const m = Number(iso[2])
    const d = Number(iso[3])
    if (isValidYmd(y, m, d)) {
      return `${y}-${pad2(m)}-${pad2(d)}`
    }
    return ''
  }

  const ru = RU_DATE_RE.exec(trimmed)
  if (ru) {
    const d = Number(ru[1])
    const m = Number(ru[2])
    const y = Number(ru[3])
    if (isValidYmd(y, m, d)) {
      return `${y}-${pad2(m)}-${pad2(d)}`
    }
    return ''
  }

  const parsed = Date.parse(trimmed)
  if (Number.isFinite(parsed)) {
    const dt = new Date(parsed)
    const y = dt.getFullYear()
    const m = dt.getMonth() + 1
    const d = dt.getDate()
    if (isValidYmd(y, m, d)) {
      return `${y}-${pad2(m)}-${pad2(d)}`
    }
  }

  return ''
}

/** Сегодня в формате для отправки в leaderboard API. */
export function leaderboardRecordDateToday(): string {
  return normalizeLeaderboardRecordDate(
    new Date().toISOString().split('T')[0]
  )
}

/** Отображение в UI: dd.MM.yyyy (ru-RU) из нормализованной ISO-даты. */
export function formatLeaderboardRecordDateForDisplay(
  isoDate: string
): string {
  const normalized =
    normalizeLeaderboardRecordDate(isoDate)
  if (!normalized) return '—'

  const m = ISO_DATE_RE.exec(normalized)
  if (!m) return '—'

  const y = Number(m[1])
  const month = Number(m[2])
  const day = Number(m[3])
  return new Date(
    y,
    month - 1,
    day
  ).toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}
