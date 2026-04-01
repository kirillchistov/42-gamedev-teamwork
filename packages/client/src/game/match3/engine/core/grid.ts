/**
 * grid.ts создаёт стартовое поле и гарантирует (best-effort), что в начале нет готовых матчей.
 * Поле хранится как матрица чисел: 0..N-1 — тип фишки, -1 — пустая клетка.
 * Внутри есть пере-брос значений при генерации, чтобы не появлялись авто-комбо на старте.
 * Этот модуль используется при запуске партии и при полном пересоздании доски/поля.
 */

import { findMatches } from './match'

export type Board = number[][]

function randInt(maxExclusive: number): number {
  return Math.floor(Math.random() * maxExclusive)
}

function makeEmptyBoard(
  rows: number,
  cols: number
): Board {
  return Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => -1)
  )
}

function hasMatchAt(
  board: Board,
  r: number,
  c: number
): boolean {
  const v = board[r]?.[c]
  if (typeof v !== 'number' || v < 0) return false

  // Проверяем по горизонтали (смотрим влево)
  const a = board[r]?.[c - 1]
  const b = board[r]?.[c - 2]
  if (a === v && b === v) return true

  // Проверяем по вертикали (смотрим вверх)
  const x = board[r - 1]?.[c]
  const y = board[r - 2]?.[c]
  if (x === v && y === v) return true

  return false
}

function pickKindNoImmediateMatch(
  board: Board,
  r: number,
  c: number,
  kinds: number
): number {
  const MAX_ATTEMPTS = Math.max(8, kinds * 2)
  let candidate = randInt(kinds)
  let attempts = 0

  while (attempts < MAX_ATTEMPTS) {
    board[r][c] = candidate
    if (!hasMatchAt(board, r, c)) return candidate
    candidate = randInt(kinds)
    attempts += 1
  }

  // Выкидываем по возможности первый тип фишки, который не дает комбинации с ходу
  for (let k = 0; k < kinds; k += 1) {
    board[r][c] = k
    if (!hasMatchAt(board, r, c)) return k
  }

  // В крайнем случае
  board[r][c] = candidate
  return candidate
}

/**
 * Создаем поле без готовых комбинаций
 */
export function createBoard(
  rows: number,
  cols: number,
  kinds: number
): Board {
  if (!Number.isInteger(rows) || rows <= 0)
    throw new Error(
      'Ряды должны быть целым числом >=0'
    )
  if (!Number.isInteger(cols) || cols <= 0)
    throw new Error(
      'Колонки должны быть целым числом >=0'
    )
  if (!Number.isInteger(kinds) || kinds <= 1)
    throw new Error(
      'Типы должны быть целым числом > 1'
    )

  const board = makeEmptyBoard(rows, cols)

  for (let r = 0; r < rows; r += 1) {
    for (let c = 0; c < cols; c += 1) {
      pickKindNoImmediateMatch(board, r, c, kinds)
    }
  }

  // Если все-таки выпала готовая комбинация, перетасовываем несколько раз
  const MAX_PASSES = 10
  for (
    let pass = 0;
    pass < MAX_PASSES;
    pass += 1
  ) {
    const matches = findMatches(board)
    if (matches.length === 0) break
    for (const m of matches) {
      const row = board[m.r]
      if (!row) continue
      if (typeof row[m.c] !== 'number') continue
      pickKindNoImmediateMatch(
        board,
        m.r,
        m.c,
        kinds
      )
    }
  }

  return board
}
