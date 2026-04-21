import { findMatches } from './match'
import { trySwap } from './swap'
import { clearAndScore } from './scoring'
import {
  findPossibleMoves,
  shuffleBoardUntilPlayable,
} from './possibleMoves'
import {
  getSpecialType,
  encodeLineCell,
} from './cell'

describe('match3 core', () => {
  test('findMatches treats special cells by base kind', () => {
    const board = [
      [0, 100, 200],
      [1, 2, 3],
      [4, 5, 6],
    ]

    const matches = findMatches(board)
    expect(matches).toHaveLength(3)
    expect(matches).toEqual(
      expect.arrayContaining([
        { r: 0, c: 0 },
        { r: 0, c: 1 },
        { r: 0, c: 2 },
      ])
    )
  })

  test('trySwap allows only productive swaps', () => {
    const goodBoard = [
      [0, 1, 2],
      [0, 2, 1],
      [1, 0, 2],
    ]

    const ok = trySwap(goodBoard, 2, 0, 2, 1)
    expect(ok).toBe(true)
    expect(
      findMatches(goodBoard).length
    ).toBeGreaterThan(0)

    const badBoard = [
      [0, 1, 2],
      [2, 0, 1],
      [1, 2, 0],
    ]
    const bad = trySwap(badBoard, 0, 0, 0, 1)
    expect(bad).toBe(false)
  })

  test('clearAndScore creates special tile for long match', () => {
    const board = [
      [0, 0, 0, 0, 2],
      [1, 2, 3, 4, 5],
      [5, 4, 3, 2, 1],
      [1, 2, 3, 4, 5],
      [5, 4, 3, 2, 1],
    ]
    const matches = findMatches(board)
    const score = clearAndScore(board, matches)

    expect(score).toBeGreaterThan(40)
    const specials = board.flat().filter(v => {
      return getSpecialType(v) !== null
    })
    expect(specials.length).toBeGreaterThan(0)
  })

  test('line special in match clears full row', () => {
    const board = [
      [2, encodeLineCell(2, 'row'), 2, 0, 1],
      [0, 1, 3, 4, 2],
      [2, 3, 4, 5, 0],
    ]
    const matches = findMatches(board)
    expect(matches).toEqual(
      expect.arrayContaining([
        { r: 0, c: 0 },
        { r: 0, c: 1 },
        { r: 0, c: 2 },
      ])
    )
    clearAndScore(board, matches)
    expect(board[0]).toEqual([-1, -1, -1, -1, -1])
  })

  test('possible moves and shuffle recover dead board', () => {
    const deadBoard = [
      [0, 1, 2, 3],
      [2, 3, 0, 1],
      [1, 0, 3, 2],
      [3, 2, 1, 0],
    ]

    expect(
      findPossibleMoves(deadBoard)
    ).toHaveLength(0)
    const shuffled = shuffleBoardUntilPlayable(
      deadBoard,
      200
    )
    expect(shuffled).toBe(true)
    expect(findMatches(deadBoard)).toHaveLength(0)
    expect(
      findPossibleMoves(deadBoard).length
    ).toBeGreaterThan(0)
  })
})
