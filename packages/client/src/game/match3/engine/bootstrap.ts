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
import {
  findPossibleMoves,
  shuffleBoardUntilPlayable,
  type MoveCandidate,
} from './core/possibleMoves'
import {
  MATCH3_BOARD_LOGICAL_PX,
  pickCellAt,
  preloadIconTheme,
  type RenderOpts,
  renderBoard,
} from './renderer'
import {
  GAME_DURATION_SEC,
  type BoardFieldThemeOption,
  type GameLimitMode,
  match3AnimMs,
  type MoveLimitOption,
  type GameIconThemeOption,
  type GameThemeOption,
  type GameVfxQualityOption,
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
import {
  isAdjacentCell,
  isSameCell,
  clampCursor,
  createMatch3InputController,
} from './inputController'
import {
  createIdleHintController,
  createRoundTimer,
} from './sessionRuntime'
import {
  runOneResolvePass,
  type ResolveTileMotion,
} from './resolvePass'
import { classifySwapCelebration } from './resolvePipeline'
import {
  countPositiveCells,
  createGoalGrid,
  createIceGrid,
  type OverlayGrid,
} from './obstacleSystem'
import { syncRecordsFromScore } from './hudSync'
import {
  loadDailyRecord,
  loadPlayerRecord,
} from '../systems/records'
import {
  createMatchFx,
  type MatchFxApi,
} from './matchFx'

export type { GameHudState }

export type GameEndReason =
  | 'goalReached'
  | 'timeOut'
  | 'movesOut'

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
  /**
   * Каскадный множитель текущего прохода (1 = первый матч, 2+ = комбо).
   * UI может использовать для лёгкого screen shake при chain ≥ 3.
   */
  onComboShake?: (chain: number) => void
  /**
   * Матч 4+ в линии или T/L-форма: UI может показать искристую обводку поля.
   */
  onPremiumMatchBorder?: (
    shape: 'line4plus' | 'tOrL'
  ) => void
  /** По умолчанию `full`: частицы и вспышка на fx-canvas. `simple` — только лёгкая подсветка матчей. */
  vfxQuality?: GameVfxQualityOption
}

const DEFAULT_HINT_IDLE_MS = 10000
const SWAP_ANIM_MS = match3AnimMs(140)
const ICE_HP = 1
const ICE_SCORE_PER_DAMAGE = 10
const ICE_SCORE_BREAK_BONUS = 40
const TARGET_HP = 1
const TARGET_SCORE_PER_HIT = 60

type TileMotion = ResolveTileMotion
type IceGrid = OverlayGrid
type GoalGrid = OverlayGrid

type SoundFx =
  | 'swap'
  | 'match'
  | 'cascade'
  | 'win'
  | 'lose'

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
    onComboShake,
    onPremiumMatchBorder,
    vfxQuality: initialVfxQuality,
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
  let fxCtx: CanvasRenderingContext2D | null =
    null

  if (fxCanvas) {
    const fxCtxMaybe = fxCanvas.getContext('2d')
    if (fxCtxMaybe) {
      fxCtx = fxCtxMaybe
      matchFx = createMatchFx(fxCtx)
    }
  }

  const syncBoardCanvasDpr = () => {
    const dpr = Math.min(
      2.5,
      typeof window !== 'undefined'
        ? window.devicePixelRatio || 1
        : 1
    )
    const buf = Math.max(
      1,
      Math.round(MATCH3_BOARD_LOGICAL_PX * dpr)
    )
    canvas.width = buf
    canvas.height = buf
    if (typeof ctx.setTransform === 'function') {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    ctx.imageSmoothingEnabled = true
    if ('imageSmoothingQuality' in ctx) {
      ctx.imageSmoothingQuality = 'high'
    }
    if (fxCanvas && fxCtx) {
      fxCanvas.width = buf
      fxCanvas.height = buf
      if (
        typeof fxCtx.setTransform === 'function'
      ) {
        fxCtx.setTransform(dpr, 0, 0, dpr, 0, 0)
      }
      fxCtx.imageSmoothingEnabled = true
      if ('imageSmoothingQuality' in fxCtx) {
        fxCtx.imageSmoothingQuality = 'high'
      }
    }
  }

  syncBoardCanvasDpr()

  let gameVfxQuality: GameVfxQualityOption =
    initialVfxQuality ?? 'full'

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
  let iceGrid: IceGrid = []
  let goalGrid: GoalGrid = []
  let boardSize = 8
  let tileKinds = tileKindsForBoardSize(boardSize)
  let forcedTileKinds: number | null = null
  let gameDurationSec = GAME_DURATION_SEC
  let gameLimitMode: GameLimitMode = 'time'
  let gameMoveLimit: MoveLimitOption = 75
  let gameGoalScore = 0
  let gameTheme: GameThemeOption = 'standard'
  let gameIconTheme: GameIconThemeOption =
    'cosmic'
  let gameBoardField: BoardFieldThemeOption =
    'space'
  let soundEnabled = true
  let scoreMode: ScoreMode = 'x1'
  let gameIceMultiplier: 1 | 2 | 4 = 1
  let gameTargetCells = 0
  let phase: Phase = 'idle'
  let isAnimating = false
  let isResolving = false
  let firstPick: CellRC | null = null
  let keyboardCursor: CellRC | null = null
  let targetCell: CellRC | null = null
  let targetPulse = false
  let hintMove: MoveCandidate | null = null
  let hintPulsePhase = 0
  let hintIdleMs = DEFAULT_HINT_IDLE_MS
  let inputBlocked = false
  let hintPulseRedrawId: number | null = null
  const DRAG_SWAP_THRESHOLD_PX = 12

  const emitHud = () => onHudChange?.({ ...hud })

  const scoreMult = () =>
    scoreMultiplier(scoreMode)

  const drawBoard = (opts?: RenderOpts) => {
    renderBoard(ctx, board, {
      hintFrom: hintMove?.from ?? null,
      hintTo: hintMove?.to ?? null,
      hintPulsePhase,
      iceGrid,
      goalGrid,
      ...opts,
      theme: gameTheme,
      iconTheme: gameIconTheme,
      boardField: gameBoardField,
    })
  }

  const onBoardCanvasResize = () => {
    syncBoardCanvasDpr()
    drawBoard()
  }
  if (typeof window !== 'undefined') {
    window.addEventListener(
      'resize',
      onBoardCanvasResize
    )
  }

  let audioCtx: AudioContext | null = null
  const ensureAudio = () => {
    if (!soundEnabled) return null
    const Ctx = window.AudioContext
    if (!Ctx) return null
    if (!audioCtx) {
      audioCtx = new Ctx()
    }
    if (audioCtx.state === 'suspended') {
      void audioCtx.resume()
    }
    return audioCtx
  }

  const playSound = (fx: SoundFx) => {
    if (!soundEnabled) return
    const ac = ensureAudio()
    if (!ac) return
    const now = ac.currentTime
    const makeTone = (
      freq: number,
      dur: number,
      type: OscillatorType,
      gainFrom: number,
      gainTo: number,
      when = 0
    ) => {
      const osc = ac.createOscillator()
      const gain = ac.createGain()
      osc.type = type
      osc.frequency.setValueAtTime(
        freq,
        now + when
      )
      gain.gain.setValueAtTime(
        gainFrom,
        now + when
      )
      gain.gain.exponentialRampToValueAtTime(
        Math.max(0.0001, gainTo),
        now + when + dur
      )
      osc.connect(gain)
      gain.connect(ac.destination)
      osc.start(now + when)
      osc.stop(now + when + dur)
    }

    if (fx === 'swap') {
      makeTone(
        360,
        0.05,
        'triangle',
        0.04,
        0.0001
      )
      return
    }
    if (fx === 'match') {
      makeTone(520, 0.08, 'sine', 0.06, 0.0001)
      makeTone(
        680,
        0.09,
        'sine',
        0.04,
        0.0001,
        0.03
      )
      return
    }
    if (fx === 'cascade') {
      makeTone(
        420,
        0.07,
        'triangle',
        0.05,
        0.0001
      )
      makeTone(
        620,
        0.09,
        'triangle',
        0.04,
        0.0001,
        0.03
      )
      makeTone(
        820,
        0.1,
        'triangle',
        0.03,
        0.0001,
        0.06
      )
      return
    }
    if (fx === 'win') {
      makeTone(523, 0.09, 'sine', 0.07, 0.0001)
      makeTone(
        659,
        0.11,
        'sine',
        0.06,
        0.0001,
        0.06
      )
      makeTone(
        784,
        0.14,
        'sine',
        0.05,
        0.0001,
        0.12
      )
      return
    }
    makeTone(240, 0.12, 'sawtooth', 0.06, 0.0001)
    makeTone(
      180,
      0.12,
      'sawtooth',
      0.05,
      0.0001,
      0.06
    )
  }

  const cloneBoard = (src: Board): Board =>
    src.map(row => [...row])

  const inBounds = (r: number, c: number) =>
    r >= 0 &&
    c >= 0 &&
    r < board.length &&
    c < (board[0]?.length ?? 0)

  const isFrozenCell = (r: number, c: number) =>
    (iceGrid[r]?.[c] ?? 0) > 0

  const getMatchBoard = (): Board =>
    board.map((row, r) =>
      row.map((value, c) =>
        isFrozenCell(r, c) ? -1 : value
      )
    )

  const trySwapConsideringIce = (
    a: CellRC,
    b: CellRC
  ): boolean => {
    if (!isAdjacentCell(a, b)) return false
    if (
      !inBounds(a.r, a.c) ||
      !inBounds(b.r, b.c)
    )
      return false
    if (
      isFrozenCell(a.r, a.c) ||
      isFrozenCell(b.r, b.c)
    )
      return false
    const aRow = board[a.r]
    const bRow = board[b.r]
    if (!aRow || !bRow) return false
    const v1 = aRow[a.c]
    const v2 = bRow[b.c]
    if (
      typeof v1 !== 'number' ||
      typeof v2 !== 'number' ||
      v1 < 0 ||
      v2 < 0
    )
      return false
    aRow[a.c] = v2
    bRow[b.c] = v1
    const ok =
      findMatches(getMatchBoard()).length > 0
    if (!ok) {
      aRow[a.c] = v1
      bRow[b.c] = v2
    }
    return ok
  }

  const computeIceCount = () => {
    const base = boardSize >= 12 ? 2 : 1
    return base * gameIceMultiplier
  }

  const animateTileMotions = (
    motions: TileMotion[],
    durationMs: number,
    opts?: { overshoot?: boolean }
  ): Promise<void> => {
    if (!motions.length || durationMs <= 0) {
      drawBoard()
      return Promise.resolve()
    }
    isAnimating = true
    return new Promise(resolve => {
      const start = performance.now()
      const tick = (now: number) => {
        const t = Math.min(
          1,
          (now - start) / durationMs
        )
        const eased = opts?.overshoot
          ? (() => {
              const s = 1.25
              const x = t - 1
              return x * x * ((s + 1) * x + s) + 1
            })()
          : 1 - Math.pow(1 - t, 3)
        drawBoard({
          tileMotions: motions,
          motionProgress: eased,
        })
        if (t >= 1) {
          isAnimating = false
          drawBoard()
          resolve()
          return
        }
        window.requestAnimationFrame(tick)
      }
      window.requestAnimationFrame(tick)
    })
  }

  const buildFallMotions = (
    before: Board,
    after: Board
  ): TileMotion[] => {
    const rows = after.length
    const cols =
      rows > 0 ? after[0]?.length ?? 0 : 0
    const motions: TileMotion[] = []
    for (let c = 0; c < cols; c += 1) {
      const sourceRows: number[] = []
      for (let r = rows - 1; r >= 0; r -= 1) {
        const v = before[r]?.[c]
        if (typeof v === 'number' && v >= 0) {
          sourceRows.push(r)
        }
      }
      let sourceIdx = 0
      let spawnIdx = 0
      for (let r = rows - 1; r >= 0; r -= 1) {
        const v = after[r]?.[c]
        if (typeof v !== 'number' || v < 0)
          continue
        const fromR =
          sourceIdx < sourceRows.length
            ? sourceRows[sourceIdx++]
            : -1 - spawnIdx++
        if (fromR === r) continue
        motions.push({
          from: { r: fromR, c },
          to: { r, c },
        })
      }
    }
    return motions
  }

  const idleHint = createIdleHintController({
    getPhase: () => phase,
    getInputBlocked: () => inputBlocked,
    getIsResolving: () => isResolving,
    getHintIdleMs: () => hintIdleMs,
    selectionBlocksHint: () =>
      Boolean(firstPick || targetCell),
    getCurrentHintMove: () => hintMove,
    setHintMove: m => {
      const hadHint = hintMove != null
      hintMove = m
      if (hintMove) {
        startHintPulseAnimation()
      } else if (hadHint) {
        stopHintPulseAnimation()
      }
    },
    getFirstMoveCandidate: () =>
      findPossibleMoves(getMatchBoard())[0],
    redraw: drawBoard,
  })

  const clearHint = () => idleHint.clearHint()
  const stopHintTimer = () => idleHint.stopTimer()
  const scheduleHint = () => idleHint.schedule()
  const markPlayerActivity = () =>
    idleHint.markActivity()

  const stopHintPulseAnimation = () => {
    if (hintPulseRedrawId !== null) {
      window.clearInterval(hintPulseRedrawId)
      hintPulseRedrawId = null
    }
    hintPulsePhase = 0
  }

  const startHintPulseAnimation = () => {
    if (hintPulseRedrawId !== null) return
    hintPulseRedrawId = window.setInterval(() => {
      if (!hintMove || phase !== 'playing') {
        stopHintPulseAnimation()
        drawBoard()
        return
      }
      hintPulsePhase =
        (performance.now() % 1650) / 1650
      drawBoard()
    }, 42)
  }

  let roundTimer: ReturnType<
    typeof createRoundTimer
  > | null = null

  const finishGame = (reason: GameEndReason) => {
    playSound(
      reason === 'goalReached' ? 'win' : 'lose'
    )
    phase = 'ended'
    roundTimer?.stop()
    stopHintTimer()
    clearHint()
    syncGoalProgress(hud)
    const synced = syncRecordsFromScore(hud.score)
    hud.playerRecord = synced.playerRecord
    hud.dailyRecord = synced.dailyRecord
    emitHud()
    onGameEnd?.({
      reason,
      snapshot: { ...hud },
    })
  }

  roundTimer = createRoundTimer({
    getPhase: () => phase,
    getInputBlocked: () => inputBlocked,
    getTimeLeftSec: () => hud.timeLeftSec,
    setTimeLeftSec: next => {
      hud.timeLeftSec = next
    },
    emitHud,
    onTimeUp: () => finishGame('timeOut'),
  })

  const stopTimer = () => roundTimer?.stop()
  const startGameTimer = () => roundTimer?.start()

  const renderInteraction = () => {
    const target =
      targetCell ??
      (firstPick &&
      keyboardCursor &&
      !isSameCell(firstPick, keyboardCursor)
        ? keyboardCursor
        : null)

    drawBoard({
      selected: firstPick ?? keyboardCursor,
      target,
      targetPulse,
    })
  }

  function flashMatches(
    matches: CellRC[],
    opts?: { durationMs?: number; chain?: number }
  ): Promise<void> {
    const fullVfx = gameVfxQuality === 'full'
    const baseDurationMs = fullVfx
      ? opts?.durationMs ?? 200
      : Math.min(opts?.durationMs ?? 220, 140)
    const durationMs = match3AnimMs(
      baseDurationMs
    )
    const chain = Math.max(1, opts?.chain ?? 1)
    if (
      matchFx &&
      matches.length > 0 &&
      fullVfx
    ) {
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
        const alpha = fullVfx
          ? 0.4 + 0.6 * Math.sin(t * Math.PI * 3)
          : 0.5 + 0.45 * Math.sin(t * Math.PI)
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

  const celebrateSwap = (
    a: CellRC,
    b: CellRC,
    style: 'normal' | 'line4plus' | 'tOrL',
    matches: CellRC[]
  ) => {
    if (!matchFx || gameVfxQuality !== 'full')
      return
    matchFx.burstCelebration(
      board,
      matches.length > 0 ? matches : [a, b],
      gameTheme,
      style
    )
    ensureFxLoop()
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
        const { matched, nextChain } =
          await runOneResolvePass({
            board,
            getMatchBoard,
            isFrozenCell,
            getIceGrid: () => iceGrid,
            setIceGrid: g => {
              iceGrid = g
            },
            getGoalGrid: () => goalGrid,
            setGoalGrid: g => {
              goalGrid = g
            },
            hud,
            tileKinds,
            chain,
            gameVfxQuality,
            gameTheme,
            scoreMult,
            iceScorePerDamage:
              ICE_SCORE_PER_DAMAGE,
            iceBreakBonus: ICE_SCORE_BREAK_BONUS,
            targetScorePerHit:
              TARGET_SCORE_PER_HIT,
            onPremiumMatchBorder,
            onComboShake,
            playSound,
            matchFx,
            ensureFxLoop,
            cloneBoard,
            buildFallMotions,
            animateTileMotions,
            flashMatches,
            clearHint,
            emitHud,
            delay,
          })
        if (!matched) break
        maxChain = Math.max(maxChain, chain)
        chain = nextChain
      }

      if (maxChain > 0) {
        hud.maxCombo = Math.max(
          hud.maxCombo,
          maxChain
        )
      }
      hud.currentCombo = 0
      syncGoalProgress(hud)
      const synced = syncRecordsFromScore(
        hud.score
      )
      hud.playerRecord = synced.playerRecord
      hud.dailyRecord = synced.dailyRecord

      const hasAnyMoves =
        findPossibleMoves(getMatchBoard())
          .length > 0
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
        hud.score >= gameGoalScore &&
        hud.goalTargetsLeft <= 0
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
    iceGrid = createIceGrid(
      board,
      computeIceCount(),
      ICE_HP
    )
    goalGrid = createGoalGrid(
      board,
      gameTargetCells,
      TARGET_HP
    )
    hud.goalTargetsTotal = gameTargetCells
    hud.goalTargetsLeft =
      countPositiveCells(goalGrid)
    syncGoalProgress(hud)
    keyboardCursor = {
      r: Math.floor(boardSize / 2),
      c: Math.floor(boardSize / 2),
    }
    targetCell = null
    targetPulse = false
    drawBoard()
  }

  async function handleSelectCell(cell: CellRC) {
    if (
      phase !== 'playing' ||
      isResolving ||
      isAnimating ||
      inputBlocked
    )
      return
    markPlayerActivity()
    if (isFrozenCell(cell.r, cell.c)) {
      drawBoard()
      return
    }

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

    const source = firstPick
    const ok = trySwapConsideringIce(source, cell)
    firstPick = null
    targetCell = null

    if (ok) {
      playSound('swap')
      await animateTileMotions(
        [
          { from: source, to: cell },
          { from: cell, to: source },
        ],
        SWAP_ANIM_MS
      )
      const immediateMatches = findMatches(
        getMatchBoard()
      )
      const style = classifySwapCelebration(
        immediateMatches
      )
      celebrateSwap(
        source,
        cell,
        style,
        immediateMatches
      )
      hud.moves += 1
      drawBoard()
      await resolveBoard()
      if (
        phase === 'playing' &&
        gameLimitMode === 'moves' &&
        hud.moves >= gameMoveLimit
      ) {
        finishGame('movesOut')
        return
      }
    } else {
      drawBoard()
    }
    emitHud()
  }

  const moveKeyboardCursor = (
    dr: number,
    dc: number
  ) => {
    if (inputBlocked) return
    markPlayerActivity()
    const rows = board.length
    const cols =
      rows > 0 ? board[0]?.length ?? 0 : 0
    keyboardCursor = clampCursor(
      keyboardCursor,
      dr,
      dc,
      rows,
      cols
    )
    if (!keyboardCursor) return
    renderInteraction()
  }

  const selectKeyboardCursor = () => {
    if (inputBlocked) return
    if (!keyboardCursor) return
    void handleSelectCell(keyboardCursor)
  }

  const match3Input = createMatch3InputController(
    {
      canvas,
      dragThresholdPx: DRAG_SWAP_THRESHOLD_PX,
      getBoard: () => board,
      pointerGuard: () =>
        phase === 'playing' &&
        !isResolving &&
        !isAnimating &&
        !inputBlocked,
      keyboardGuard: () =>
        phase === 'playing' &&
        !isAnimating &&
        !inputBlocked,
      ensureAudio,
      markActivity: markPlayerActivity,
      onPointerDownPick: ev => {
        const cell = pickCellAt(board, canvas, ev)
        if (!cell) return
        void handleSelectCell(cell)
      },
      moveKeyboardCursor,
      submitKeyboardCursor: selectKeyboardCursor,
      renderInteraction,
      onSelectCell: handleSelectCell,
      setKeyboardCursor: cell => {
        keyboardCursor = cell
      },
      clearPointerPreview: () => {
        targetCell = null
        targetPulse = false
        renderInteraction()
      },
      setPointerPreviewTarget: cell => {
        targetCell = cell
        targetPulse = false
        renderInteraction()
      },
      onPointerUpWithoutDragCommit: () => {
        if (targetCell) {
          targetCell = null
          targetPulse = false
          renderInteraction()
        }
      },
    }
  )

  canvas.tabIndex = 0
  canvas.addEventListener(
    'pointerdown',
    match3Input.onPointerDown
  )
  canvas.addEventListener(
    'pointermove',
    match3Input.onPointerMove
  )
  canvas.addEventListener(
    'pointerup',
    match3Input.onPointerUpOrCancel
  )
  canvas.addEventListener(
    'pointercancel',
    match3Input.onPointerUpOrCancel
  )
  window.addEventListener(
    'keydown',
    match3Input.onKeyDown
  )
  window.addEventListener(
    'keyup',
    match3Input.onKeyUp
  )

  const resetIdle = () => {
    stopTimer()
    stopHintTimer()
    clearHint()
    cancelFxLoop()
    matchFx?.reset()
    match3Input.clearDragState()
    match3Input.clearPressedKeys()
    phase = 'idle'
    board = []
    iceGrid = []
    goalGrid = []
    firstPick = null
    keyboardCursor = null
    targetCell = null
    targetPulse = false
    resetHudForIdle(hud, {
      durationSec: gameDurationSec,
      playerRecord: loadPlayerRecord(),
      dailyRecord: loadDailyRecord(),
      goalScore: gameGoalScore,
      goalTargetsTotal: gameTargetCells,
      goalTargetsLeft: gameTargetCells,
    })
    drawBoard()
    emitHud()
  }

  const startPlay = () => {
    stopTimer()
    stopHintTimer()
    clearHint()
    match3Input.clearDragState()
    match3Input.clearPressedKeys()
    phase = 'playing'
    resetHudForPlay(hud, {
      durationSec: gameDurationSec,
      playerRecord: loadPlayerRecord(),
      dailyRecord: loadDailyRecord(),
      goalScore: gameGoalScore,
      goalTargetsTotal: gameTargetCells,
      goalTargetsLeft: gameTargetCells,
    })
    firstPick = null

    rebuildBoard()
    void resolveBoard().then(() => {
      if (gameLimitMode === 'time') {
        startGameTimer()
      }
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

  const setLimitMode = (mode: GameLimitMode) => {
    gameLimitMode = mode
    if (phase === 'playing') {
      if (mode === 'time') {
        startGameTimer()
      } else {
        stopTimer()
      }
    }
  }

  const setMoveLimit = (
    moveLimit: MoveLimitOption
  ) => {
    gameMoveLimit = moveLimit
  }

  const setTheme = (theme: GameThemeOption) => {
    gameTheme = theme
    drawBoard()
  }

  const setIconTheme = (
    iconTheme: GameIconThemeOption
  ) => {
    gameIconTheme = iconTheme
    drawBoard()
    void preloadIconTheme(iconTheme).then(() => {
      if (phase === 'ended') return
      drawBoard()
    })
  }

  const setBoardField = (
    field: BoardFieldThemeOption
  ) => {
    gameBoardField = field
    drawBoard()
  }

  const setLevel = (level: LevelConfig) => {
    boardSize = level.boardSize
    gameDurationSec = level.durationSec
    gameGoalScore = level.goalValue
    gameTheme = level.theme
    forcedTileKinds = level.tileKinds
    gameIceMultiplier = level.iceMultiplier ?? 1
    gameTargetCells = Math.max(
      0,
      level.targetCells ?? 0
    )

    if (phase === 'playing') {
      rebuildBoard()
      void resolveBoard().then(() => emitHud())
      return
    }

    hud.timeLeftSec = gameDurationSec
    hud.goalScore = gameGoalScore
    hud.goalTargetsTotal = gameTargetCells
    hud.goalTargetsLeft = gameTargetCells
    syncGoalProgress(hud)
    rebuildBoard()
    emitHud()
  }

  const setScoreMode = (mode: ScoreMode) => {
    scoreMode = mode
    emitHud()
  }

  const setHintIdleMs = (ms: number) => {
    if (!Number.isFinite(ms) || ms < 1000) return
    hintIdleMs = Math.floor(ms)
    if (phase === 'playing') {
      scheduleHint()
    }
  }

  const setSoundEnabled = (enabled: boolean) => {
    soundEnabled = Boolean(enabled)
    if (soundEnabled) {
      ensureAudio()
    }
  }

  const setVfxQuality = (
    q: GameVfxQualityOption
  ) => {
    gameVfxQuality = q
    if (q === 'simple') {
      cancelFxLoop()
      matchFx?.reset()
    }
  }

  const setInputBlocked = (blocked: boolean) => {
    inputBlocked = Boolean(blocked)
    if (inputBlocked) {
      match3Input.clearDragState()
      match3Input.clearPressedKeys()
      firstPick = null
      targetCell = null
      targetPulse = false
      clearHint()
      stopHintTimer()
      drawBoard()
      return
    }
    if (phase === 'playing') {
      scheduleHint()
    }
  }

  const destroy = () => {
    canvas.removeEventListener(
      'pointerdown',
      match3Input.onPointerDown
    )
    canvas.removeEventListener(
      'pointermove',
      match3Input.onPointerMove
    )
    canvas.removeEventListener(
      'pointerup',
      match3Input.onPointerUpOrCancel
    )
    canvas.removeEventListener(
      'pointercancel',
      match3Input.onPointerUpOrCancel
    )
    window.removeEventListener(
      'keydown',
      match3Input.onKeyDown
    )
    window.removeEventListener(
      'keyup',
      match3Input.onKeyUp
    )
    if (typeof window !== 'undefined') {
      window.removeEventListener(
        'resize',
        onBoardCanvasResize
      )
    }
    stopTimer()
    stopHintTimer()
    stopHintPulseAnimation()
    cancelFxLoop()
    matchFx?.reset()
    if (audioCtx) {
      void audioCtx.close()
      audioCtx = null
    }
  }

  resetIdle()

  return {
    resetIdle,
    startPlay,
    setBoardSize,
    setDuration,
    setLimitMode,
    setMoveLimit,
    setTheme,
    setIconTheme,
    setBoardField,
    setSoundEnabled,
    setVfxQuality,
    setInputBlocked,
    setLevel,
    setScoreMode,
    setHintIdleMs,
    destroy,
  }
}
