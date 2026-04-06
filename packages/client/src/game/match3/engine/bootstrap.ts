/**
 * bootstrap.ts связывает логику match-3 с UI-слоем и жизненным циклом партии.
 * Создаём/перезапускаем поле, запускаем таймер и обрабатываем действия юзера.
 * Файл отвечает за фазы экрана (idle/playing/ended), пересчёт HUD и обновление рекордов.
 * Renderer/core-модули остаются "чистыми", а bootstrap выступает оркестратором состояния.
 * 6.1.1 Улучшить ядро игры: отделить логику от визуала:
 * оставил в bootstrap только оркестрацию партии, таймеров, ввода и вызовов рендера;
 * GameHudState теперь реэкспортится из gameState, чтобы внешний API не ломать.
 * 6.1.2 Игровые настройки перед стартом:
 * Добавил параметры партии в runtime: gameDurationSec, gameTheme
 * Добавил методы API игры: setDuration(durationSec), setTheme(theme)
 * Обновил рендер через единый drawBoard(...), чтобы тема применялась везде
 * resetIdle / startPlay теперь используют выбранную длительность, а не только дефолт
 * 6.1.3 Модели уровней:
 * Добавлен метод setLevel(level: LevelConfig) — применяет параметры уровня одним вызовом
 * Добавлена поддержка принудительного tileKinds из уровня
 * При выборе уровня до старта обновляются: размер поля, длительность, тема, число типов фишек
 * Если уровень меняется во время игры — поле перестраивается
 * 6.1.4 Улучшение HUD:
 * Добавил runtime-параметр gameGoalScore
 * В setLevel теперь прокидываю goalValue из уровня
 * Во время каскада: обновляю currentCombo, пересчитываю goalProgressPct
 * После resolve: сбрасываю currentCombo, maxCombo фиксируем как лучший
 * При reset/start HUD получает актуальную цель (goalScore)
 * 6.1.6 Спец фишки: Фазы highlight → clear → fall → refill уже работают
 * 6.1.7 Поиск возможных ходов и выход из тупика:
 * После завершения resolveBoard() проверяю наличие ходов
 * при тупике вызываю shuffleBoardUntilPlayable
 * если shuffle не собрал валидную доску, пересдаем поле rebuildBoard()
 */

import type { Board } from './core/grid'
import { findMatches } from './core/match'
import type { CellRC } from './core/match'
import { collapse } from './core/collapse'
import { refill } from './core/refill'
import { trySwap } from './core/swap'
import { clearAndScore } from './core/scoring'
import {
  findPossibleMoves,
  shuffleBoardUntilPlayable,
} from './core/possibleMoves'
import {
  pickCellAt,
  type RenderOpts,
  renderBoard,
} from './renderer'
import {
  GAME_DURATION_SEC,
  type GameThemeOption,
} from './config'
import {
  createInitialHud,
  createPlayableBoard,
  resetHudForIdle,
  resetHudForPlay,
  scoreMultiplier,
  syncGoalProgress,
  tileKindsForBoardSize,
  type GameHudState,
  type Phase,
  type ScoreMode,
} from './gameState'
import type { LevelConfig } from './levels'
import { maybeUpdateHighScore } from '../systems/highscore'
import {
  loadDailyRecord,
  loadPlayerRecord,
  updateDailyRecord,
  updatePlayerRecord,
} from '../systems/records'

export type { GameHudState }

type CreateParams = {
  canvas: HTMLCanvasElement
  onHudChange?: (next: GameHudState) => void
  onGameEnd?: (snapshot: GameHudState) => void
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
  const ctxMaybe = canvas.getContext('2d')
  if (!ctxMaybe) {
    throw new Error(
      'Canvas 2D context unavailable'
    )
  }
  const ctx: CanvasRenderingContext2D = ctxMaybe

  canvas.style.touchAction = 'none'

  const hud = createInitialHud()

  let board: Board = []
  let boardSize = 8
  let tileKinds = tileKindsForBoardSize(boardSize)
  let forcedTileKinds: number | null = null
  let gameDurationSec = GAME_DURATION_SEC
  let gameGoalScore = 0
  let gameTheme: GameThemeOption = 'standard'
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

  const scoreMult = () =>
    scoreMultiplier(scoreMode)

  const drawBoard = (opts?: RenderOpts) => {
    renderBoard(ctx, board, {
      ...opts,
      theme: gameTheme,
    })
  }

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

    drawBoard({
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
        drawBoard({
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
        hud.currentCombo = chain
        syncGoalProgress(hud)
        emitHud()
        maxChain = Math.max(maxChain, chain)

        collapse(board)
        refill(board, tileKinds)
        drawBoard()
        chain += 1
        await delay(45)
      }

      if (maxChain > 0) {
        hud.maxCombo = Math.max(
          hud.maxCombo,
          maxChain
        )
      }
      hud.currentCombo = 0
      syncGoalProgress(hud)
      syncRecordsFromScore()

      const hasAnyMoves =
        findPossibleMoves(board).length > 0
      if (!hasAnyMoves) {
        const shuffled =
          shuffleBoardUntilPlayable(board)
        if (!shuffled) {
          rebuildBoard()
        }
      }

      drawBoard()
      emitHud()
    } finally {
      isResolving = false
    }
  }

  const rebuildBoard = () => {
    const next = createPlayableBoard(
      boardSize,
      forcedTileKinds ?? undefined
    )
    tileKinds = next.tileKinds
    board = next.board
    keyboardCursor = {
      r: Math.floor(boardSize / 2),
      c: Math.floor(boardSize / 2),
    }
    targetCell = null
    targetPulse = false
    drawBoard()
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
      drawBoard()
      await resolveBoard()
    } else {
      drawBoard()
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
    resetHudForIdle(hud, {
      durationSec: gameDurationSec,
      playerRecord: loadPlayerRecord(),
      dailyRecord: loadDailyRecord(),
      goalScore: gameGoalScore,
    })
    drawBoard()
    emitHud()
  }

  const startPlay = () => {
    stopTimer()
    phase = 'playing'
    resetHudForPlay(hud, {
      durationSec: gameDurationSec,
      playerRecord: loadPlayerRecord(),
      dailyRecord: loadDailyRecord(),
      goalScore: gameGoalScore,
    })
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
      drawBoard()
      emitHud()
    }
  }

  const setDuration = (durationSec: number) => {
    if (
      !Number.isInteger(durationSec) ||
      durationSec <= 0
    ) {
      return
    }
    gameDurationSec = durationSec
    if (phase !== 'playing') {
      hud.timeLeftSec = gameDurationSec
      emitHud()
    }
  }

  const setTheme = (theme: GameThemeOption) => {
    gameTheme = theme
    drawBoard()
  }

  const setLevel = (level: LevelConfig) => {
    boardSize = level.boardSize
    gameDurationSec = level.durationSec
    gameGoalScore = level.goalValue
    gameTheme = level.theme
    forcedTileKinds = level.tileKinds

    if (phase === 'playing') {
      rebuildBoard()
      void resolveBoard().then(() => emitHud())
      return
    }

    hud.timeLeftSec = gameDurationSec
    hud.goalScore = gameGoalScore
    syncGoalProgress(hud)
    rebuildBoard()
    emitHud()
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
    setDuration,
    setTheme,
    setLevel,
    setScoreMode,
    destroy,
  }
}
