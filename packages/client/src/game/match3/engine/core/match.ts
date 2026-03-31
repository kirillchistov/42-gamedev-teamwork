// Цель игры: построит комбинацию из соседних фишек (по горизонтали или вертикали
// - 3+ фишки (>0) составляют комбинацию
// - поиск по маске и по ячейкам
// ============================================================

import type { Board } from './grid'

export type CellRC = { r: number; c: number }

function pushUnique(
  out: CellRC[],
  seen: Set<string>,
  r: number,
  c: number
) {
  const key = `${r},${c}`
  if (seen.has(key)) return
  seen.add(key)
  out.push({ r, c })
}

export function findMatches(
  board: Board
): CellRC[] {
  const rows = board.length
  const cols =
    rows > 0 ? board[0]?.length ?? 0 : 0

  if (rows === 0 || cols === 0) return []

  const out: CellRC[] = []
  const seen = new Set<string>()

  // Проход по горизонтали
  for (let r = 0; r < rows; r += 1) {
    const row = board[r]
    if (!row) continue

    let c = 0
    while (c < cols) {
      const v = row[c]
      if (typeof v !== 'number' || v < 0) {
        c += 1
        continue
      }

      const start = c
      let end = c + 1
      while (end < cols && row[end] === v)
        end += 1

      const len = end - start
      if (len >= 3) {
        for (let x = start; x < end; x += 1)
          pushUnique(out, seen, r, x)
      }

      c = end
    }
  }

  // Проход по вертикали
  for (let c = 0; c < cols; c += 1) {
    let r = 0
    while (r < rows) {
      const v = board[r]?.[c]
      if (typeof v !== 'number' || v < 0) {
        r += 1
        continue
      }

      const start = r
      let end = r + 1
      while (end < rows && board[end]?.[c] === v)
        end += 1

      const len = end - start
      if (len >= 3) {
        for (let y = start; y < end; y += 1)
          pushUnique(out, seen, y, c)
      }

      r = end
    }
  }

  return out
}
