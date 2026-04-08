/**
 * 6.1.7 Поиск возможных ходов и выход из тупика
 * possibleMoves.ts - модуль поиска ходов и шафл тупикового поля
 * findPossibleMoves(board): проверяет соседние свопы (вправо/вниз)
 * возвращает список валидных ходов
 * shuffleBoardUntilPlayable(board, maxAttempts): перетасовывает текущие фишки на поле
 * добивается состояния: без готовых матчей на старте с хотя бы одним возможным ходом
 * если не удалось — возвращает false
 */

import type { Board } from './grid'
import type { CellRC } from './match'
import { findMatches } from './match'
import { isEmptyCell } from './cell'

function inBounds(
  board: Board,
  r: number,
  c: number
): boolean {
  const rows = board.length
  const cols =
    rows > 0 ? board[0]?.length ?? 0 : 0
  return r >= 0 && c >= 0 && r < rows && c < cols
}

function swapCells(
  board: Board,
  a: CellRC,
  b: CellRC
) {
  const aRow = board[a.r]
  const bRow = board[b.r]
  if (!aRow || !bRow) return
  const temp = aRow[a.c]
  aRow[a.c] = bRow[b.c] as number
  bRow[b.c] = temp as number
}

function wouldCreateMatch(
  board: Board,
  a: CellRC,
  b: CellRC
): boolean {
  if (!inBounds(board, a.r, a.c)) return false
  if (!inBounds(board, b.r, b.c)) return false
  const av = board[a.r]?.[a.c]
  const bv = board[b.r]?.[b.c]
  if (
    typeof av !== 'number' ||
    typeof bv !== 'number'
  )
    return false
  if (isEmptyCell(av) || isEmptyCell(bv))
    return false

  swapCells(board, a, b)
  const hasMatch = findMatches(board).length > 0
  swapCells(board, a, b)
  return hasMatch
}

export type MoveCandidate = {
  from: CellRC
  to: CellRC
}

export function findPossibleMoves(
  board: Board
): MoveCandidate[] {
  const rows = board.length
  const cols =
    rows > 0 ? board[0]?.length ?? 0 : 0
  const out: MoveCandidate[] = []
  if (rows === 0 || cols === 0) return out

  for (let r = 0; r < rows; r += 1) {
    for (let c = 0; c < cols; c += 1) {
      const from = { r, c }
      const right = { r, c: c + 1 }
      const down = { r: r + 1, c }

      if (inBounds(board, right.r, right.c)) {
        if (
          wouldCreateMatch(board, from, right)
        ) {
          out.push({ from, to: right })
        }
      }

      if (inBounds(board, down.r, down.c)) {
        if (wouldCreateMatch(board, from, down)) {
          out.push({ from, to: down })
        }
      }
    }
  }

  return out
}

function shuffleInPlace(values: number[]): void {
  for (let i = values.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    const tmp = values[i]
    values[i] = values[j] as number
    values[j] = tmp as number
  }
}

function applyShuffledValues(
  board: Board,
  values: number[]
): void {
  let idx = 0
  for (let r = 0; r < board.length; r += 1) {
    const row = board[r]
    if (!row) continue
    for (let c = 0; c < row.length; c += 1) {
      if (isEmptyCell(row[c] as number)) continue
      row[c] = values[idx] as number
      idx += 1
    }
  }
}

export function shuffleBoardUntilPlayable(
  board: Board,
  maxAttempts = 80
): boolean {
  const values: number[] = []
  for (let r = 0; r < board.length; r += 1) {
    const row = board[r]
    if (!row) continue
    for (let c = 0; c < row.length; c += 1) {
      const v = row[c]
      if (typeof v !== 'number' || isEmptyCell(v))
        continue
      values.push(v)
    }
  }
  if (values.length === 0) return false

  const original = [...values]

  for (let i = 0; i < maxAttempts; i += 1) {
    const attempt = [...values]
    shuffleInPlace(attempt)
    applyShuffledValues(board, attempt)

    const hasImmediateMatches =
      findMatches(board).length > 0
    if (hasImmediateMatches) continue

    const hasMoves =
      findPossibleMoves(board).length > 0
    if (hasMoves) return true
  }

  applyShuffledValues(board, original)
  return false
}
