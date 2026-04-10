/**
 * match.ts ищет все совпадения 3+ по горизонтали и вертикали в текущей матрице.
 * Модуль возвращает плоский список координат, которые нужно удалить на следующем шаге.
 * Логика не изменяет поле и не начисляет очки — она только детектирует матчи.
 * Такой контракт делает функцию удобной для повторного вызова в каскадных проходах.
 * 6.1.6 Спец-фишки:
 * Обновлена матчинговая логика под спец-клетки
 * match.ts (grid.ts, refill.ts) теперь сравнивают по базовому kind, а не по “сырым” числам
 * это позволяет спец-фишкам участвовать в обычных матчах как фишки своего цвета/типа
 */

import type { Board } from './grid'
import { getCellKind, isEmptyCell } from './cell'

export type CellRC = { r: number; c: number }

function pushUnique(
  out: CellRC[],
  seen: Set<string>,
  rowIndex: number,
  colIndex: number
) {
  const key = `${rowIndex},${colIndex}`
  if (seen.has(key)) return
  seen.add(key)
  out.push({ r: rowIndex, c: colIndex })
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
      if (
        typeof v !== 'number' ||
        isEmptyCell(v)
      ) {
        c += 1
        continue
      }
      const kind = getCellKind(v)

      const start = c
      let end = c + 1
      while (
        end < cols &&
        typeof row[end] === 'number' &&
        !isEmptyCell(row[end] as number) &&
        getCellKind(row[end] as number) === kind
      )
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
      if (
        typeof v !== 'number' ||
        isEmptyCell(v)
      ) {
        r += 1
        continue
      }
      const kind = getCellKind(v)

      const start = r
      let end = r + 1
      while (
        end < rows &&
        typeof board[end]?.[c] === 'number' &&
        !isEmptyCell(board[end]?.[c] as number) &&
        getCellKind(board[end]?.[c] as number) ===
          kind
      )
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
