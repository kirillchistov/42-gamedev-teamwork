/**
 * scoring.ts очищает совпавшие клетки и возвращает количество очков за текущий проход.
 * Сначала удаляются дубли координат, затем каждая валидная клетка переводится в -1.
 * Сейчас расчёт очков базовый (10 за клетку), но модуль вынесен, можно расширять логику.
 * Именно сюда будем добавлять бонусы за формы матчей, цепочки и спец-фишки.
 */

import type { Board } from './grid'
import type { CellRC } from './match'

function uniqCells(cells: CellRC[]): CellRC[] {
  const seen = new Set<string>()
  const out: CellRC[] = []
  for (const c of cells) {
    const key = `${c.r},${c.c}`
    if (seen.has(key)) continue
    seen.add(key)
    out.push(c)
  }
  return out
}

function isInBounds(
  board: Board,
  r: number,
  c: number
): boolean {
  const rows = board.length
  const cols =
    rows > 0 ? board[0]?.length ?? 0 : 0
  return r >= 0 && c >= 0 && r < rows && c < cols
}

/**
 * Убирает комбинации (присвивает -1) и возвращает очки.
 */
export function clearAndScore(
  board: Board,
  matches: CellRC[]
): number {
  const unique = uniqCells(matches)
  let cleared = 0

  for (const m of unique) {
    if (!isInBounds(board, m.r, m.c)) continue
    const row = board[m.r]
    if (!row) continue
    if (row[m.c] === -1) continue
    row[m.c] = -1
    cleared += 1
  }

  // Базово: 10 очков за каждую убранную фишку
  return cleared * 10
}
