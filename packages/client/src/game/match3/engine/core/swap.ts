/**
 * swap.ts проверяет и выполняет обмен двух соседних клеток.
 * Обмен подтверждается только если после него появляется хотя бы один матч.
 * Если матч не найден, модуль откатывает значения назад и возвращает false.
 * За счёт этого правило «ход только с результатом» централизовано в одном месте.
 */

import type { Board } from './grid'
import { findMatches } from './match'

function isAdjacent(
  r1: number,
  c1: number,
  r2: number,
  c2: number
): boolean {
  const dr = Math.abs(r1 - r2)
  const dc = Math.abs(c1 - c2)
  return (
    (dr === 1 && dc === 0) ||
    (dr === 0 && dc === 1)
  )
}

/**
 * Пробуем поменять две соседние клетки.
 * Сохраняем обмен только если получилась комбинация
 */
export function trySwap(
  board: Board,
  r1: number,
  c1: number,
  r2: number,
  c2: number
): boolean {
  if (!isAdjacent(r1, c1, r2, c2)) return false

  const aRow = board[r1]
  const bRow = board[r2]
  if (!aRow || !bRow) return false

  const a = aRow[c1]
  const b = bRow[c2]
  if (
    typeof a !== 'number' ||
    typeof b !== 'number'
  )
    return false
  if (a < 0 || b < 0) return false

  // swap
  aRow[c1] = b
  bRow[c2] = a

  const ok = findMatches(board).length > 0
  if (!ok) {
    // revert
    aRow[c1] = a
    bRow[c2] = b
  }

  return ok
}
