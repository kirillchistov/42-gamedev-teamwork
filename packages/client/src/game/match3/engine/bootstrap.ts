import type { Board } from './core/grid'
import { createBoard } from './core/grid'
import { findMatches } from './core/match'
import type { CellRC } from './core/match'
import { collapse } from './core/collapse'
import { refill } from './core/refill'
import { trySwap } from './core/swap'
import { clearAndScore } from './core/scoring'
import {
  pickCellAt,
  renderBoard,
} from './renderer'
import {
  BOARD_SIZE_OPTIONS,
  GAME_DURATION_SEC,
  TILE_KINDS_BY_BOARD_SIZE,
  type BoardSizeOption,
} from './config'
import { maybeUpdateHighScore } from '../systems/highscore'
import {
  loadDailyRecord,
  loadPlayerRecord,
  updateDailyRecord,
  updatePlayerRecord,
} from '../systems/records'

export type GameHudState = {
  score: number
  moves: number
  maxCombo: number
  playerRecord: number
  dailyRecord: number
  timeLeftSec: number
}

type ScoreMode = 'x1' | 'x2' | 'x3'

type Phase = 'idle' | 'playing' | 'ended'

type CreateParams = {
  canvas: HTMLCanvasElement
  onHudChange?: (next: GameHudState) => void
  onGameEnd?: (snapshot: GameHudState) => void
}

const SCORE_MULT: Record<ScoreMode, number> = {
  x1: 1,
  x2: 2,
  x3: 3,
}

function isBoardSize(
  n: number
): n is BoardSizeOption {
  return (
    BOARD_SIZE_OPTIONS as readonly number[]
  ).includes(n)
}

function tileKindsForBoardSize(
  size: number
): number {
  if (isBoardSize(size))
    return TILE_KINDS_BY_BOARD_SIZE[size]
  return TILE_KINDS_BY_BOARD_SIZE[8]
}

function delay(ms: number): Promise<void> {
  return new Promise(resolve => {
    window.setTimeout(resolve, ms)
  })
}

export function createMatch3Game(
  params: CreateParams
) {
  const { canvas, onHudChange, onGameEnd } =
    params
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    throw new Error(
      'Canvas 2D context unavailable'
    )
  }

  canvas.style.touchAction = 'none'

  const hud: GameHudState = {
    score: 0,
    moves: 0,
    maxCombo: 0,
    playerRecord: 0,
    dailyRecord: 0,
    timeLeftSec: GAME_DURATION_SEC,
  }

  let board: Board = []
  let boardSize = 8
  let tileKinds = tileKindsForBoardSize(boardSize)
  let scoreMode: ScoreMode = 'x1'
  let phase: Phase = 'idle'
  let timerId: number | null = null
  let isResolving = false
  let firstPick: CellRC | null = null

  const emitHud = () => onHudChange?.({ ...hud })

  const scoreMult = () => SCORE_MULT[scoreMode]

  const syncRecordsFromScore = () => {
    hud.playerRecord = updatePlayerRecord(
      hud.score
    )
    hud.dailyRecord = updateDailyRecord(hud.score)
    maybeUpdateHighScore(hud.score)
  }

  function flashMatches(
    matches: CellRC[],
    durationMs = 200
  ): Promise<void> {
    return new Promise(resolve => {
      const start = performance.now()
      const step = (now: number) => {
        const t = Math.min(
          1,
          (now - start) / durationMs
        )
        const alpha =
          0.4 + 0.6 * Math.sin(t * Math.PI * 3)
        renderBoard(ctx, board, {
          highlight: matches,
          alpha,
        })
        if (t >= 1) resolve()
        else requestAnimationFrame(step)
      }
      requestAnimationFrame(step)
    })
  }

  async function resolveBoard(): Promise<void> {
    if (isResolving) return
    isResolving = true
    let chain = 1
    let maxChain = 0

    try {
      const maxPasses = 80
      let pass = 0

      while (pass < maxPasses) {
        pass += 1
        const matches = findMatches(board)
        if (matches.length === 0) break

        await flashMatches(matches, 220)
        const base = clearAndScore(board, matches)
        const gained = Math.floor(
          base * chain * scoreMult()
        )
        hud.score += gained
        maxChain = Math.max(maxChain, chain)

        collapse(board)
        refill(board, tileKinds)
        renderBoard(ctx, board)
        chain += 1
        await delay(45)
      }

      if (maxChain > 0) {
        hud.maxCombo = Math.max(
          hud.maxCombo,
          maxChain
        )
      }
      syncRecordsFromScore()
      renderBoard(ctx, board)
      emitHud()
    } finally {
      isResolving = false
    }
  }

  const rebuildBoard = () => {
    tileKinds = tileKindsForBoardSize(boardSize)
    board = createBoard(
      boardSize,
      boardSize,
      tileKinds
    )
    renderBoard(ctx, board)
  }

  const stopTimer = () => {
    if (timerId !== null) {
      window.clearInterval(timerId)
      timerId = null
    }
  }

  const startGameTimer = () => {
    stopTimer()
    timerId = window.setInterval(() => {
      if (phase !== 'playing') return
      if (hud.timeLeftSec <= 0) return
      hud.timeLeftSec -= 1
      emitHud()
      if (hud.timeLeftSec === 0) {
        phase = 'ended'
        syncRecordsFromScore()
        stopTimer()
        emitHud()
        onGameEnd?.({ ...hud })
      }
    }, 1000)
  }

  async function handlePick(ev: PointerEvent) {
    if (phase !== 'playing' || isResolving) return
    const cell = pickCellAt(board, canvas, ev)
    if (!cell) return

    if (!firstPick) {
      firstPick = cell
      renderBoard(ctx, board, {
        selected: firstPick,
      })
      return
    }

    const ok = trySwap(
      board,
      firstPick.r,
      firstPick.c,
      cell.r,
      cell.c
    )
    firstPick = null

    if (ok) {
      hud.moves += 1
      renderBoard(ctx, board)
      await resolveBoard()
    } else {
      renderBoard(ctx, board)
    }
    emitHud()
  }

  const onPointerDown = (ev: PointerEvent) => {
    void handlePick(ev)
  }

  canvas.addEventListener(
    'pointerdown',
    onPointerDown
  )

  const resetIdle = () => {
    stopTimer()
    phase = 'idle'
    board = []
    firstPick = null
    hud.score = 0
    hud.moves = 0
    hud.maxCombo = 0
    hud.timeLeftSec = GAME_DURATION_SEC
    hud.playerRecord = loadPlayerRecord()
    hud.dailyRecord = loadDailyRecord()
    renderBoard(ctx, board)
    emitHud()
  }

  const startPlay = () => {
    stopTimer()
    phase = 'playing'
    hud.score = 0
    hud.moves = 0
    hud.maxCombo = 0
    hud.timeLeftSec = GAME_DURATION_SEC
    hud.playerRecord = loadPlayerRecord()
    hud.dailyRecord = loadDailyRecord()
    firstPick = null

    rebuildBoard()
    void resolveBoard().then(() => {
      startGameTimer()
      emitHud()
    })
    emitHud()
  }

  const setBoardSize = (size: number) => {
    if (!Number.isInteger(size) || size < 4)
      return
    boardSize = size
    if (phase === 'playing') {
      rebuildBoard()
      void resolveBoard().then(() => emitHud())
    } else {
      rebuildBoard()
      renderBoard(ctx, board)
      emitHud()
    }
  }

  const setScoreMode = (mode: ScoreMode) => {
    scoreMode = mode
    emitHud()
  }

  const destroy = () => {
    canvas.removeEventListener(
      'pointerdown',
      onPointerDown
    )
    stopTimer()
  }

  resetIdle()

  return {
    resetIdle,
    startPlay,
    setBoardSize,
    setScoreMode,
    destroy,
  }
}
