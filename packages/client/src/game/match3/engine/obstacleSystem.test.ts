import {
  createGoalGridFromLayout,
  type OverlayGrid,
} from './obstacleSystem'

function buildBoard(
  rows: number,
  cols: number
): number[][] {
  return Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => 1)
  )
}

function readPositiveCells(
  grid: OverlayGrid
): Array<[number, number]> {
  const out: Array<[number, number]> = []
  for (let r = 0; r < grid.length; r += 1) {
    for (
      let c = 0;
      c < (grid[r]?.length ?? 0);
      c += 1
    ) {
      if ((grid[r]?.[c] ?? 0) > 0)
        out.push([r, c])
    }
  }
  return out
}

describe('obstacleSystem goal layout', () => {
  test('uses only provided layout cells', () => {
    const board = buildBoard(4, 4)
    const grid = createGoalGridFromLayout(
      board,
      [
        { r: 0, c: 0 },
        { r: 2, c: 1 },
      ],
      1
    )

    expect(readPositiveCells(grid)).toEqual([
      [0, 0],
      [2, 1],
    ])
  })

  test('ignores out-of-bounds layout entries', () => {
    const board = buildBoard(3, 3)
    const grid = createGoalGridFromLayout(
      board,
      [
        { r: 1, c: 1 },
        { r: 7, c: 2 },
      ],
      1
    )

    expect(readPositiveCells(grid)).toEqual([
      [1, 1],
    ])
  })
})
