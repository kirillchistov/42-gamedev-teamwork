// ============================================================
// Цель: Убрать ячейки в комбинации, начислить очки игроку
// ------------------------------------------------------------
// Принимает список значений клеток {r,c} или маску с булевым значением.
// Убранные клетки делает -1 и возвращает (начисляет очки) по правилам.
//
// Скоринг
// - Базовые очки за каждое убранную клетку (по умолчанию 10).
// - Бонус за РОВНО N фишек в комбинации (напр., 4 => +5).
// - Бонус за МИНИМУМ N фишек в комбинации (напр., 5+ => +15).
//
// - Если убираем группу (CellRC[][]), очки за каждую группу считаются отдельно:
//     group_points = perCell * groupSize
//                   + exactBonus[groupSize] (if any)
//                   + best atLeastBonus where groupSize >= threshold (if any)
//   Общий счет очков = сумма всех групп.
// - Если не "группы", то подсчет основан на сумме убранных фишек:
//     total_points = perCell * totalCleared
//                    + exactBonus[totalCleared] (if any)
//                    + best atLeastBonus where totalCleared >= threshold (if any)

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
