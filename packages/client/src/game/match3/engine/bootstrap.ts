/**
 * bootstrap.ts связывает чистую логику match-3 с UI-слоем и жизненным циклом партии.
 * Создаём/перезапускаем поле, запускаем таймер и обрабатываем действия юзера.
 * Файл отвечает за фазы экрана (idle/playing/ended), пересчёт HUD и обновление рекордов.
 * Renderer/core-модули остаются "чистыми", а bootstrap выступает оркестратором состояния.
 */
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
  let keyboardCursor: CellRC | null = null
  let targetCell: CellRC | null = null
  let targetPulse = false
  const pressedKeys = new Set<string>()

  const emitHud = () => onHudChange?.({ ...hud })

  const scoreMult = () => SCORE_MULT[scoreMode]

  const sameCell = (
    a: CellRC | null,
    b: CellRC | null
  ) =>
    Boolean(a && b && a.r === b.r && a.c === b.c)

  const renderInteraction = () => {
    const target =
      targetCell ??
      (firstPick &&
      keyboardCursor &&
      !sameCell(firstPick, keyboardCursor)
        ? keyboardCursor
        : null)

    renderBoard(ctx, board, {
      selected: firstPick ?? keyboardCursor,
      target,
      targetPulse,
      showSwapArrow: Boolean(firstPick && target),
    })
  }

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
    keyboardCursor = {
      r: Math.floor(boardSize / 2),
      c: Math.floor(boardSize / 2),
    }
    targetCell = null
    targetPulse = false
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

  async function handleSelectCell(cell: CellRC) {
    if (phase !== 'playing' || isResolving) return

    if (!firstPick) {
      firstPick = cell
      targetCell = null
      targetPulse = false
      renderInteraction()
      return
    }

    targetCell = cell
    targetPulse = true
    renderInteraction()
    await delay(120)
    targetPulse = false

    const ok = trySwap(
      board,
      firstPick.r,
      firstPick.c,
      cell.r,
      cell.c
    )
    firstPick = null
    targetCell = null

    if (ok) {
      hud.moves += 1
      renderBoard(ctx, board)
      await resolveBoard()
    } else {
      renderBoard(ctx, board)
    }
    emitHud()
  }

  async function handlePick(ev: PointerEvent) {
    if (phase !== 'playing' || isResolving) return
    const cell = pickCellAt(board, canvas, ev)
    if (!cell) return
    keyboardCursor = cell
    await handleSelectCell(cell)
  }

  const moveKeyboardCursor = (
    dr: number,
    dc: number
  ) => {
    if (!keyboardCursor) {
      keyboardCursor = { r: 0, c: 0 }
    }
    const rows = board.length
    const cols =
      rows > 0 ? board[0]?.length ?? 0 : 0
    if (rows === 0 || cols === 0) return
    keyboardCursor = {
      r: Math.max(
        0,
        Math.min(rows - 1, keyboardCursor.r + dr)
      ),
      c: Math.max(
        0,
        Math.min(cols - 1, keyboardCursor.c + dc)
      ),
    }
    renderInteraction()
  }

  const selectKeyboardCursor = () => {
    if (!keyboardCursor) return
    void handleSelectCell(keyboardCursor)
  }

  const onKeyDown = (ev: KeyboardEvent) => {
    if (phase !== 'playing') return
    const code = ev.code
    if (pressedKeys.has(code)) return
    pressedKeys.add(code)

    if (code === 'ArrowUp' || code === 'KeyW') {
      ev.preventDefault()
      moveKeyboardCursor(-1, 0)
      return
    }
    if (code === 'ArrowDown' || code === 'KeyS') {
      ev.preventDefault()
      moveKeyboardCursor(1, 0)
      return
    }
    if (code === 'ArrowLeft' || code === 'KeyA') {
      ev.preventDefault()
      moveKeyboardCursor(0, -1)
      return
    }
    if (
      code === 'ArrowRight' ||
      code === 'KeyD'
    ) {
      ev.preventDefault()
      moveKeyboardCursor(0, 1)
      return
    }
    if (code === 'Enter' || code === 'Space') {
      ev.preventDefault()
      selectKeyboardCursor()
    }
  }

  const onKeyUp = (ev: KeyboardEvent) => {
    pressedKeys.delete(ev.code)
  }

  const onPointerDown = (ev: PointerEvent) => {
    canvas.focus()
    void handlePick(ev)
  }

  canvas.tabIndex = 0
  canvas.addEventListener(
    'pointerdown',
    onPointerDown
  )
  window.addEventListener('keydown', onKeyDown)
  window.addEventListener('keyup', onKeyUp)

  const resetIdle = () => {
    stopTimer()
    phase = 'idle'
    board = []
    firstPick = null
    keyboardCursor = null
    targetCell = null
    targetPulse = false
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
    window.removeEventListener(
      'keydown',
      onKeyDown
    )
    window.removeEventListener('keyup', onKeyUp)
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
