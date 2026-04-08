import type { Board } from './core/grid'
import type { CellRC } from './core/match'
import {
  getLineOrientation,
  getSpecialType,
} from './core/cell'

export type CelebrationStyle =
  | 'normal'
  | 'line4plus'
  | 'tOrL'

export type ResolveSpecialActivation = {
  cell: CellRC
  type: 'line' | 'bomb'
  orientation?: 'row' | 'col'
}

export function classifySwapCelebration(
  matches: CellRC[]
): CelebrationStyle {
  if (matches.length < 3) return 'normal'
  const keySet = new Set(
    matches.map(m => `${m.r},${m.c}`)
  )
  let hasTL = false
  let longestLine = 0
  for (const cell of matches) {
    let rowRun = 1
    let c = cell.c - 1
    while (keySet.has(`${cell.r},${c}`)) {
      rowRun += 1
      c -= 1
    }
    c = cell.c + 1
    while (keySet.has(`${cell.r},${c}`)) {
      rowRun += 1
      c += 1
    }

    let colRun = 1
    let r = cell.r - 1
    while (keySet.has(`${r},${cell.c}`)) {
      colRun += 1
      r -= 1
    }
    r = cell.r + 1
    while (keySet.has(`${r},${cell.c}`)) {
      colRun += 1
      r += 1
    }

    if (rowRun >= 3 && colRun >= 3) hasTL = true
    longestLine = Math.max(
      longestLine,
      rowRun,
      colRun
    )
  }
  if (hasTL) return 'tOrL'
  if (longestLine >= 4) return 'line4plus'
  return 'normal'
}

export function collectSpecialActivations(
  snapshot: Board,
  initial: CellRC[]
): ResolveSpecialActivation[] {
  const rows = snapshot.length
  const cols =
    rows > 0 ? snapshot[0]?.length ?? 0 : 0
  if (rows === 0 || cols === 0) return []
  const inBounds = (r: number, c: number) =>
    r >= 0 && c >= 0 && r < rows && c < cols
  const key = (r: number, c: number) =>
    `${r},${c}`
  const seen = new Set<string>()
  const queue = [...initial]
  const activations: ResolveSpecialActivation[] =
    []
  for (const m of initial) seen.add(key(m.r, m.c))
  while (queue.length > 0) {
    const cell = queue.shift()
    if (!cell || !inBounds(cell.r, cell.c))
      continue
    const value = snapshot[cell.r]?.[cell.c]
    if (typeof value !== 'number' || value < 0)
      continue
    const special = getSpecialType(value)
    if (!special) continue
    if (special === 'line') {
      const orientation =
        getLineOrientation(value) ?? 'row'
      activations.push({
        cell,
        type: 'line',
        orientation,
      })
      if (orientation === 'row') {
        for (let c = 0; c < cols; c += 1) {
          const k = key(cell.r, c)
          if (seen.has(k)) continue
          seen.add(k)
          queue.push({ r: cell.r, c })
        }
      } else {
        for (let r = 0; r < rows; r += 1) {
          const k = key(r, cell.c)
          if (seen.has(k)) continue
          seen.add(k)
          queue.push({ r, c: cell.c })
        }
      }
    } else {
      activations.push({ cell, type: 'bomb' })
      for (let dr = -1; dr <= 1; dr += 1) {
        for (let dc = -1; dc <= 1; dc += 1) {
          const rr = cell.r + dr
          const cc = cell.c + dc
          if (!inBounds(rr, cc)) continue
          const k = key(rr, cc)
          if (seen.has(k)) continue
          seen.add(k)
          queue.push({ r: rr, c: cc })
        }
      }
    }
  }
  return activations
}

export function collectClearedCells(
  rows: number,
  cols: number,
  matches: CellRC[],
  activations: ResolveSpecialActivation[]
): CellRC[] {
  const out: CellRC[] = []
  const seen = new Set<string>()
  const inBounds = (r: number, c: number) =>
    r >= 0 && c >= 0 && r < rows && c < cols
  const push = (r: number, c: number) => {
    if (!inBounds(r, c)) return
    const key = `${r},${c}`
    if (seen.has(key)) return
    seen.add(key)
    out.push({ r, c })
  }
  for (const m of matches) push(m.r, m.c)
  for (const activation of activations) {
    if (activation.type === 'line') {
      if (activation.orientation === 'col') {
        for (let r = 0; r < rows; r += 1) {
          push(r, activation.cell.c)
        }
      } else {
        for (let c = 0; c < cols; c += 1) {
          push(activation.cell.r, c)
        }
      }
    } else {
      for (let dr = -1; dr <= 1; dr += 1) {
        for (let dc = -1; dc <= 1; dc += 1) {
          push(
            activation.cell.r + dr,
            activation.cell.c + dc
          )
        }
      }
    }
  }
  return out
}
