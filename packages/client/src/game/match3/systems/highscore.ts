const HS_KEY = 'cosmatch3.highscore.v1'

export function loadHighScore(): number {
  try {
    const raw = localStorage.getItem(HS_KEY)
    if (!raw) return 0
    const n = Number(raw)
    return Number.isFinite(n) && n >= 0 ? n : 0
  } catch {
    // здесь будет console.log('').
    return 0
  }
}

export function maybeUpdateHighScore(
  score: number
): number {
  const prev = loadHighScore()
  const next = score > prev ? score : prev
  if (next !== prev) {
    try {
      localStorage.setItem(HS_KEY, String(next))
    } catch (error) {
      console.warn(
        '[match3] localStorage read failed',
        error
      )
    }
  }
  return next
}

export function clearHighScore(): void {
  try {
    localStorage.removeItem(HS_KEY)
  } catch (error) {
    console.warn(
      '[match3] localStorage read failed',
      error
    )
  }
}
