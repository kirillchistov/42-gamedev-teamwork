import type { Board } from './core/grid'
import type { CellRC } from './core/match'

export type OverlayGrid = number[][]

export type ObstacleSpecialActivation = {
  cell: CellRC
  type: 'line' | 'bomb'
  orientation?: 'row' | 'col'
}

function shuffleInPlace<T>(items: T[]) {
  for (let i = items.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    const tmp = items[i]
    items[i] = items[j] as T
    items[j] = tmp as T
  }
}

export function cloneOverlayGrid(
  src: OverlayGrid
): OverlayGrid {
  return src.map(row => [...row])
}

export function countPositiveCells(
  grid: OverlayGrid
): number {
  return grid.reduce(
    (acc, row) =>
      acc +
      row.reduce(
        (rowAcc, value) =>
          rowAcc + (value > 0 ? 1 : 0),
        0
      ),
    0
  )
}

export function createIceGrid(
  srcBoard: Board,
  count: number,
  hp: number
): OverlayGrid {
  const rows = srcBoard.length
  const cols =
    rows > 0 ? srcBoard[0]?.length ?? 0 : 0
  const grid: OverlayGrid = Array.from(
    { length: rows },
    () => Array.from({ length: cols }, () => 0)
  )
  if (rows === 0 || cols === 0 || count <= 0)
    return grid
  const targetCount = Math.min(rows * cols, count)
  const candidates: CellRC[] = []
  for (let r = 0; r < rows; r += 1) {
    for (let c = 0; c < cols; c += 1) {
      if ((srcBoard[r]?.[c] ?? -1) < 0) continue
      candidates.push({ r, c })
    }
  }
  shuffleInPlace(candidates)
  const picked: CellRC[] = []
  const hasIceNeighbor = (cell: CellRC) =>
    picked.some(
      p =>
        Math.abs(p.r - cell.r) +
          Math.abs(p.c - cell.c) ===
        1
    )
  for (const cell of candidates) {
    if (picked.length >= targetCount) break
    if (hasIceNeighbor(cell)) continue
    picked.push(cell)
  }
  if (picked.length < targetCount) {
    for (const cell of candidates) {
      if (picked.length >= targetCount) break
      if (
        picked.some(
          p => p.r === cell.r && p.c === cell.c
        )
      )
        continue
      picked.push(cell)
    }
  }
  for (const cell of picked) {
    const row = grid[cell.r]
    if (!row) continue
    row[cell.c] = hp
  }
  return grid
}

export function createGoalGrid(
  srcBoard: Board,
  count: number,
  hp: number
): OverlayGrid {
  const rows = srcBoard.length
  const cols =
    rows > 0 ? srcBoard[0]?.length ?? 0 : 0
  const grid: OverlayGrid = Array.from(
    { length: rows },
    () => Array.from({ length: cols }, () => 0)
  )
  const capped = Math.max(
    0,
    Math.min(rows * cols, Math.floor(count))
  )
  if (capped <= 0) return grid
  const candidates: CellRC[] = []
  for (let r = 0; r < rows; r += 1) {
    for (let c = 0; c < cols; c += 1) {
      if ((srcBoard[r]?.[c] ?? -1) < 0) continue
      candidates.push({ r, c })
    }
  }
  shuffleInPlace(candidates)
  for (let i = 0; i < capped; i += 1) {
    const cell = candidates[i]
    if (!cell) break
    const row = grid[cell.r]
    if (!row) continue
    row[cell.c] = hp
  }
  return grid
}

export function applyIceDamage(params: {
  iceGrid: OverlayGrid
  cleared: CellRC[]
  chain: number
  scoreMult: number
  scorePerDamage: number
  breakBonus: number
}): { nextIceGrid: OverlayGrid; score: number } {
  const {
    iceGrid,
    cleared,
    chain,
    scoreMult,
    scorePerDamage,
    breakBonus,
  } = params
  const nextIceGrid = cloneOverlayGrid(iceGrid)
  const rows = nextIceGrid.length
  const cols =
    rows > 0 ? nextIceGrid[0]?.length ?? 0 : 0
  const inBounds = (r: number, c: number) =>
    r >= 0 && c >= 0 && r < rows && c < cols
  const damaged = new Set<string>()
  let damageHits = 0
  let breaks = 0
  for (const cell of cleared) {
    const neighbors: CellRC[] = [
      { r: cell.r - 1, c: cell.c },
      { r: cell.r + 1, c: cell.c },
      { r: cell.r, c: cell.c - 1 },
      { r: cell.r, c: cell.c + 1 },
    ]
    for (const n of neighbors) {
      if (!inBounds(n.r, n.c)) continue
      const hp = nextIceGrid[n.r]?.[n.c] ?? 0
      if (hp <= 0) continue
      const key = `${n.r},${n.c}`
      if (damaged.has(key)) continue
      damaged.add(key)
      const updated = Math.max(0, hp - 1)
      const row = nextIceGrid[n.r]
      if (!row) continue
      row[n.c] = updated
      damageHits += 1
      if (updated === 0) breaks += 1
    }
  }
  const raw =
    damageHits * scorePerDamage +
    breaks * breakBonus
  return {
    nextIceGrid,
    score: Math.floor(raw * chain * scoreMult),
  }
}

export function applyGoalDamageFromBombs(params: {
  goalGrid: OverlayGrid
  activations: ObstacleSpecialActivation[]
  chain: number
  scoreMult: number
  scorePerHit: number
}): {
  nextGoalGrid: OverlayGrid
  score: number
  hits: CellRC[]
} {
  const {
    goalGrid,
    activations,
    chain,
    scoreMult,
    scorePerHit,
  } = params
  const nextGoalGrid = cloneOverlayGrid(goalGrid)
  const rows = nextGoalGrid.length
  const cols =
    rows > 0 ? nextGoalGrid[0]?.length ?? 0 : 0
  const inBounds = (r: number, c: number) =>
    r >= 0 && c >= 0 && r < rows && c < cols
  const hits: CellRC[] = []
  const seen = new Set<string>()
  const touch = (r: number, c: number) => {
    if (!inBounds(r, c)) return
    const hp = nextGoalGrid[r]?.[c] ?? 0
    if (hp <= 0) return
    const row = nextGoalGrid[r]
    if (!row) return
    row[c] = Math.max(0, hp - 1)
    if (row[c] === 0) {
      const key = `${r},${c}`
      if (seen.has(key)) return
      seen.add(key)
      hits.push({ r, c })
    }
  }
  for (const a of activations) {
    if (a.type !== 'bomb') continue
    for (let dr = -1; dr <= 1; dr += 1) {
      for (let dc = -1; dc <= 1; dc += 1) {
        touch(a.cell.r + dr, a.cell.c + dc)
      }
    }
  }
  return {
    nextGoalGrid,
    score: Math.floor(
      hits.length *
        scorePerHit *
        chain *
        scoreMult
    ),
    hits,
  }
}
