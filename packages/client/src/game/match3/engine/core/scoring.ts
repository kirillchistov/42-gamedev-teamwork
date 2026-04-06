/**
 * scoring.ts очищает совпавшие клетки и возвращает количество очков за текущий проход.
 * Сначала удаляются дубли координат, затем каждая валидная клетка переводится в -1.
 * В расчёте учитываются бонусы за формы: 4/5 в линию и T/L-подобные комбинации.
 * Цепочки каскадов (chain multiplier) добавляются в bootstrap, здесь только base+shape score.
 * 6.1.5 Улучшение скоринга:
 * Добавил базовые константы очков: 10 за клетку, +40 за 4, +120 за 5+, +90 за T/L-форму
 * Реализовал разбор матчей на связные группы (splitIntoConnectedGroups),
 * чтобы формы считались корректно внутри одного кластера.
 * Для каждой группы считаю: макс. длину ряда/колонки (4/5+),
 * “пересечения” (rowRun>=3 && colRun>=3) как признак T/L-формы
 * Финальный clearAndScore возвращает: baseScore (cells * 10) + shapeBonus
 * Каскадный множитель (chain * scoreMode) остался в bootstrap и накладывается поверх этого score.
 * 6.1.6 Спец-фишки:
 * при 4+ и сложных группах создаются спец-фишки: 4 в линию → line, * 5+ или T/L-форма → bomb,
 * при попадании спец-фишки в матч: line очищает всю строку/колонку, bomb - область 3x3
 * поддержан цепной триггер спецов (если в зону попал другой спец объект)
 */

import type { Board } from './grid'
import type { CellRC } from './match'
import {
  encodeBombCell,
  encodeLineCell,
  getCellKind,
  getLineOrientation,
  getSpecialType,
  isEmptyCell,
  type LineOrientation,
} from './cell'

const SCORE_PER_CELL = 10
const BONUS_LINE_4 = 40
const BONUS_LINE_5_PLUS = 120
const BONUS_T_OR_L = 90

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
  rowIndex: number,
  colIndex: number
): boolean {
  const rows = board.length
  const cols =
    rows > 0 ? board[0]?.length ?? 0 : 0
  return (
    rowIndex >= 0 &&
    colIndex >= 0 &&
    rowIndex < rows &&
    colIndex < cols
  )
}

function cellKey(cell: CellRC): string {
  return `${cell.r},${cell.c}`
}

function collectRowRunLength(
  groupKeys: Set<string>,
  row: number,
  col: number
): number {
  let len = 1
  let c = col - 1
  while (groupKeys.has(`${row},${c}`)) {
    len += 1
    c -= 1
  }
  c = col + 1
  while (groupKeys.has(`${row},${c}`)) {
    len += 1
    c += 1
  }
  return len
}

function collectColRunLength(
  groupKeys: Set<string>,
  row: number,
  col: number
): number {
  let len = 1
  let r = row - 1
  while (groupKeys.has(`${r},${col}`)) {
    len += 1
    r -= 1
  }
  r = row + 1
  while (groupKeys.has(`${r},${col}`)) {
    len += 1
    r += 1
  }
  return len
}

function splitIntoConnectedGroups(
  cells: CellRC[]
): CellRC[][] {
  const groups: CellRC[][] = []
  const unvisited = new Map<string, CellRC>()
  for (const cell of cells) {
    unvisited.set(cellKey(cell), cell)
  }

  while (unvisited.size > 0) {
    const firstKey = unvisited.keys().next()
      .value as string
    const first = unvisited.get(firstKey)
    if (!first) break

    const queue: CellRC[] = [first]
    unvisited.delete(firstKey)
    const group: CellRC[] = []

    while (queue.length > 0) {
      const curr = queue.shift()
      if (!curr) continue
      group.push(curr)

      const neighbors: CellRC[] = [
        { r: curr.r - 1, c: curr.c },
        { r: curr.r + 1, c: curr.c },
        { r: curr.r, c: curr.c - 1 },
        { r: curr.r, c: curr.c + 1 },
      ]

      for (const next of neighbors) {
        const key = cellKey(next)
        if (!unvisited.has(key)) continue
        const found = unvisited.get(key)
        if (!found) continue
        unvisited.delete(key)
        queue.push(found)
      }
    }

    groups.push(group)
  }

  return groups
}

function shapeBonusForGroup(
  group: CellRC[]
): number {
  if (group.length < 4) return 0

  const groupKeys = new Set(group.map(cellKey))
  let maxRowRun = 0
  let maxColRun = 0
  let hasCross = false

  for (const cell of group) {
    const rowRun = collectRowRunLength(
      groupKeys,
      cell.r,
      cell.c
    )
    const colRun = collectColRunLength(
      groupKeys,
      cell.r,
      cell.c
    )
    maxRowRun = Math.max(maxRowRun, rowRun)
    maxColRun = Math.max(maxColRun, colRun)
    if (rowRun >= 3 && colRun >= 3) {
      hasCross = true
    }
  }

  let bonus = 0
  const longestLine = Math.max(
    maxRowRun,
    maxColRun
  )
  if (longestLine >= 5) bonus += BONUS_LINE_5_PLUS
  else if (longestLine === 4)
    bonus += BONUS_LINE_4

  // Для T/L форм достаточно наличия пересечения 3x3 в связной группе.
  if (hasCross) bonus += BONUS_T_OR_L

  return bonus
}

type SpawnSpec = {
  cell: CellRC
  type: 'line' | 'bomb'
  orientation?: LineOrientation
}

function specForGroup(
  group: CellRC[]
): SpawnSpec | null {
  if (group.length < 4) return null
  const groupKeys = new Set(group.map(cellKey))
  let maxRowRun = 0
  let maxColRun = 0
  let hasCross = false
  let anchor: CellRC | null = null

  for (const cell of group) {
    const rowRun = collectRowRunLength(
      groupKeys,
      cell.r,
      cell.c
    )
    const colRun = collectColRunLength(
      groupKeys,
      cell.r,
      cell.c
    )
    if (rowRun >= 3 && colRun >= 3) {
      hasCross = true
      anchor = cell
    }
    maxRowRun = Math.max(maxRowRun, rowRun)
    maxColRun = Math.max(maxColRun, colRun)
  }

  if (!anchor) anchor = group[0] ?? null
  if (!anchor) return null

  if (hasCross || group.length >= 5) {
    return { cell: anchor, type: 'bomb' }
  }
  if (Math.max(maxRowRun, maxColRun) >= 4) {
    return {
      cell: anchor,
      type: 'line',
      orientation:
        maxRowRun >= maxColRun ? 'row' : 'col',
    }
  }
  return null
}

function pushUniqueCell(
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

function expandBySpecialEffects(
  board: Board,
  initial: CellRC[]
): CellRC[] {
  const expanded: CellRC[] = []
  const seen = new Set<string>()
  const queue = [...initial]

  for (const cell of initial) {
    pushUniqueCell(expanded, seen, cell.r, cell.c)
  }

  while (queue.length > 0) {
    const cell = queue.shift()
    if (!cell) continue
    if (!isInBounds(board, cell.r, cell.c))
      continue
    const value = board[cell.r]?.[cell.c]
    if (
      typeof value !== 'number' ||
      isEmptyCell(value)
    )
      continue
    const specialType = getSpecialType(value)
    if (!specialType) continue

    if (specialType === 'line') {
      const orientation =
        getLineOrientation(value)
      if (orientation === 'row') {
        const cols = board[0]?.length ?? 0
        for (let c = 0; c < cols; c += 1) {
          const next = { r: cell.r, c }
          const key = cellKey(next)
          if (seen.has(key)) continue
          pushUniqueCell(
            expanded,
            seen,
            next.r,
            next.c
          )
          queue.push(next)
        }
      } else {
        const rows = board.length
        for (let r = 0; r < rows; r += 1) {
          const next = { r, c: cell.c }
          const key = cellKey(next)
          if (seen.has(key)) continue
          pushUniqueCell(
            expanded,
            seen,
            next.r,
            next.c
          )
          queue.push(next)
        }
      }
    } else if (specialType === 'bomb') {
      for (let dr = -1; dr <= 1; dr += 1) {
        for (let dc = -1; dc <= 1; dc += 1) {
          const next = {
            r: cell.r + dr,
            c: cell.c + dc,
          }
          if (!isInBounds(board, next.r, next.c))
            continue
          const key = cellKey(next)
          if (seen.has(key)) continue
          pushUniqueCell(
            expanded,
            seen,
            next.r,
            next.c
          )
          queue.push(next)
        }
      }
    }
  }

  return expanded
}

/**
 * Убирает комбинации (присвивает -1) и возвращает очки.
 */
export function clearAndScore(
  board: Board,
  matches: CellRC[]
): number {
  const unique = uniqCells(matches)
  const groups = splitIntoConnectedGroups(unique)
  let shapeBonus = 0
  for (const group of groups) {
    shapeBonus += shapeBonusForGroup(group)
  }
  const spawnSpecs = groups
    .map(specForGroup)
    .filter(Boolean) as SpawnSpec[]
  const spawnCellKeys = new Set(
    spawnSpecs.map(spec => cellKey(spec.cell))
  )
  const expandedToClear = expandBySpecialEffects(
    board,
    unique
  )

  let cleared = 0

  for (const m of expandedToClear) {
    if (!isInBounds(board, m.r, m.c)) continue
    const row = board[m.r]
    if (!row) continue
    if (spawnCellKeys.has(cellKey(m))) continue
    if (isEmptyCell(row[m.c] as number)) continue
    row[m.c] = -1
    cleared += 1
  }

  for (const spec of spawnSpecs) {
    const row = board[spec.cell.r]
    if (!row) continue
    const prev = row[spec.cell.c]
    if (typeof prev !== 'number') continue
    const kind = getCellKind(prev)
    if (kind < 0) continue
    row[spec.cell.c] =
      spec.type === 'bomb'
        ? encodeBombCell(kind)
        : encodeLineCell(
            kind,
            spec.orientation ?? 'row'
          )
  }

  const baseScore = cleared * SCORE_PER_CELL
  return baseScore + shapeBonus
}
