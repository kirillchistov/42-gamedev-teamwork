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
 * 6.1.8 Таймер бездействия и подсказка хода
 * Таймер бездействия HINT_IDLE_MS = 4000
 * Состояние подсказки: hintMove (пара клеток для подсветки), hintTimeoutId
 * Логика: scheduleHint() — ставит таймер,
 * showHintIfIdle() — через 4с ищет первый возможный ход (findPossibleMoves) и подсвечивает
 * markPlayerActivity() — сбрасывает подсказку и перезапускает таймер stopHintTimer() / clearHint()
 * при любом действии (pointer/keyboard/select/move курсора) вызывается markPlayerActivity()
 * после resolveBoard() таймер перезапускается, при resetIdle(), startPlay(), destroy() таймер очищается
 * 6.1.9 Экран результата уровня
 * Добавил типы: GameEndReason = 'goalReached' | 'timeOut' и GameEndPayload = { reason, snapshot }
 * onGameEnd теперь возвращает не только snapshot, но и reason.
 * Добавил finishGame(reason): завершает партию, останавливает таймер/подсказки,
 * фиксирует HUD и отправляет payload в UI.
 * Логика завершения: при достижении цели уровня (score >= goalScore) — goalReached, при timeOut
 * 6.3.1 VFX при матче (частицы + вспышка):
 * Опциональный параметр createMatch3Game({ fxCanvas }) и createMatchFx(ctx)
 * В flashMatches: burstFromMatches + ensureFxLoop; цикл requestAnimationFrame пока isActive
 * Сброс слоя: cancelFxLoop + matchFx.reset в resetIdle и destroy
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
import {
  createMatchFx,
  type MatchFxApi,
} from './matchFx'

export type { GameHudState }

export type GameEndReason =
  | 'goalReached'
  | 'timeOut'

export type GameEndPayload = {
  reason: GameEndReason
  snapshot: GameHudState
}

type CreateParams = {
  canvas: HTMLCanvasElement
  /** Опционально: второй canvas (поверх поля) для частиц и вспышки. */
  fxCanvas?: HTMLCanvasElement
  onHudChange?: (next: GameHudState) => void
  onGameEnd?: (payload: GameEndPayload) => void
}

const HINT_IDLE_MS = 10000

function delay(ms: number): Promise<void> {
  return new Promise(resolve => {
    window.setTimeout(resolve, ms)
  })
}

export function createMatch3Game(
  params: CreateParams
) {
  const {
    canvas,
    fxCanvas,
    onHudChange,
    onGameEnd,
  } = params
  const ctxMaybe = canvas.getContext('2d')
  if (!ctxMaybe) {
    throw new Error(
      'Canvas 2D context unavailable'
    )
  }
  const ctx: CanvasRenderingContext2D = ctxMaybe

  let matchFx: MatchFxApi | null = null
  let fxRafId: number | null = null
  let fxLastTs = 0

  if (fxCanvas) {
    const fxCtxMaybe = fxCanvas.getContext('2d')
    if (fxCtxMaybe) {
      matchFx = createMatchFx(fxCtxMaybe)
    }
  }

  const cancelFxLoop = () => {
    if (fxRafId !== null) {
      window.cancelAnimationFrame(fxRafId)
      fxRafId = null
    }
    fxLastTs = 0
  }

  const fxLoop = (now: number) => {
    if (!matchFx) {
      fxRafId = null
      return
    }
    const dt = fxLastTs
      ? Math.min(48, now - fxLastTs)
      : 16
    fxLastTs = now
    matchFx.step(dt)
    matchFx.draw()
    if (matchFx.isActive()) {
      fxRafId =
        window.requestAnimationFrame(fxLoop)
    } else {
      fxRafId = null
      fxLastTs = 0
      matchFx.draw()
    }
  }

  const ensureFxLoop = () => {
    if (!matchFx) return
    if (fxRafId !== null) return
    fxLastTs = 0
    fxRafId = window.requestAnimationFrame(fxLoop)
  }

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
  let hintMove: {
    from: CellRC
    to: CellRC
  } | null = null
  let hintTimeoutId: number | null = null
  const pressedKeys = new Set<string>()

  const emitHud = () => onHudChange?.({ ...hud })

  const scoreMult = () =>
    scoreMultiplier(scoreMode)

  const drawBoard = (opts?: RenderOpts) => {
    renderBoard(ctx, board, {
      hintFrom: hintMove?.from ?? null,
      hintTo: hintMove?.to ?? null,
      ...opts,
      theme: gameTheme,
    })
  }

  const clearHint = () => {
    hintMove = null
  }

  const stopHintTimer = () => {
    if (hintTimeoutId !== null) {
      window.clearTimeout(hintTimeoutId)
      hintTimeoutId = null
    }
  }

  const showHintIfIdle = () => {
    if (phase !== 'playing' || isResolving) return
    if (firstPick || targetCell) return
    const candidate = findPossibleMoves(board)[0]
    if (!candidate) return
    hintMove = candidate
    drawBoard()
  }

  const scheduleHint = () => {
    stopHintTimer()
    hintTimeoutId = window.setTimeout(() => {
      showHintIfIdle()
    }, HINT_IDLE_MS)
  }

  const markPlayerActivity = () => {
    const hadHint = Boolean(hintMove)
    clearHint()
    if (phase === 'playing') {
      if (hadHint) drawBoard()
      scheduleHint()
    }
  }

  const finishGame = (reason: GameEndReason) => {
    phase = 'ended'
    stopTimer()
    stopHintTimer()
    clearHint()
    syncGoalProgress(hud)
    syncRecordsFromScore()
    emitHud()
    onGameEnd?.({
      reason,
      snapshot: { ...hud },
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
    opts?: { durationMs?: number; chain?: number }
  ): Promise<void> {
    const durationMs = opts?.durationMs ?? 200
    const chain = Math.max(1, opts?.chain ?? 1)
    if (matchFx && matches.length > 0) {
      matchFx.burstFromMatches(
        board,
        matches,
        gameTheme,
        chain
      )
      ensureFxLoop()
    }
    return new Promise(resolve => {
      const start = performance.now()
      const stepAnim = (now: number) => {
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
        else requestAnimationFrame(stepAnim)
      }
      requestAnimationFrame(stepAnim)
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

        await flashMatches(matches, {
          durationMs: 220,
          chain,
        })
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
        clearHint()
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
        clearHint()
        const shuffled =
          shuffleBoardUntilPlayable(board)
        if (!shuffled) {
          rebuildBoard()
        }
      }

      if (
        gameGoalScore > 0 &&
        hud.score >= gameGoalScore
      ) {
        finishGame('goalReached')
        return
      }

      drawBoard()
      emitHud()
      scheduleHint()
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
        finishGame('timeOut')
      }
    }, 1000)
  }

  async function handleSelectCell(cell: CellRC) {
    if (phase !== 'playing' || isResolving) return
    markPlayerActivity()

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
    markPlayerActivity()
    const cell = pickCellAt(board, canvas, ev)
    if (!cell) return
    keyboardCursor = cell
    await handleSelectCell(cell)
  }

  const moveKeyboardCursor = (
    dr: number,
    dc: number
  ) => {
    markPlayerActivity()
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
    markPlayerActivity()
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
    stopHintTimer()
    clearHint()
    cancelFxLoop()
    matchFx?.reset()
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
    stopHintTimer()
    clearHint()
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
      scheduleHint()
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
    stopHintTimer()
    cancelFxLoop()
    matchFx?.reset()
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
