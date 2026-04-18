/**
 * Match3Screen управляет пользовательскими фазами экрана: отсчёт, готовность, игра и результаты.
 * По сути - это связка движка с React. Здесь нет бизнес-логики match-3:
 * Благодаря такой структуре UI можно менять независимо от логики в engine/bootstrap.ts.
 * Компонент создаёт экземпляр игры один раз и подписывается на обновления HUD через onHudChange.
 */

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import clsx from 'clsx'
import './match3.pcss'
import {
  createMatch3Game,
  type GameEndPayload,
  type GameHudState,
} from './engine/bootstrap'
import {
  GAME_DURATION_SEC,
  PRESTART_COUNTDOWN_SEC,
  type BoardFieldThemeOption,
  type BoardSizeOption,
  type GameDurationOption,
  type GameIconThemeOption,
  type GameLimitMode,
  type MoveLimitOption,
  type GameThemeOption,
  type GameVfxQualityOption,
} from './engine/config'
import {
  DEFAULT_MATCH3_LEVEL_ID,
  getMatch3LevelById,
} from './engine/levels'

type UiPhase =
  | 'countdown'
  | 'ready'
  | 'playing'
  | 'results'
type PlayerHintsMode =
  | 'always'
  | 'never'
  | 'pauses'

const BORDER_SPARK_COUNT = 34
const BORDER_SPARK_STEP_MS = 42
const BORDER_SPARK_CLEAR_MS =
  BORDER_SPARK_COUNT * BORDER_SPARK_STEP_MS + 400

function buildBorderSparkPositions(
  n: number
): { left: string; top: string }[] {
  const out: { left: string; top: string }[] = []
  for (let i = 0; i < n; i += 1) {
    const u = (i / n) * 4
    if (u < 1) {
      out.push({
        left: `${(u / 1) * 100}%`,
        top: '0%',
      })
    } else if (u < 2) {
      out.push({
        left: '100%',
        top: `${((u - 1) / 1) * 100}%`,
      })
    } else if (u < 3) {
      out.push({
        left: `${(1 - (u - 2) / 1) * 100}%`,
        top: '100%',
      })
    } else {
      out.push({
        left: '0%',
        top: `${(1 - (u - 3) / 1) * 100}%`,
      })
    }
  }
  return out
}

const BORDER_SPARK_POSITIONS =
  buildBorderSparkPositions(BORDER_SPARK_COUNT)
const COACH_MESSAGES = [
  'Собирайте 3+ в ряд и находите спрятанные сокровища!',
  'За комбинации 4+ и бомбы/ракеты получайте комбо-баллы!',
  'Цель: набрать максимум баллов за минимальное время и число ходов',
]
const ROOKIE_TUTORIAL_GAMES_KEY =
  'match3:rookie-tutorial-games'
const ROOKIE_TUTORIAL_DONE_KEY =
  'match3:rookie-tutorial-done'
const MATCH3_HINTS_HIDDEN_KEY =
  'match3:hints-hidden'
const ROOKIE_TUTORIAL_MAX_GAMES = 3

function IconSettings() {
  return (
    <svg
      width={16}
      height={16}
      viewBox="0 0 24 24"
      aria-hidden
      fill="currentColor">
      <path d="M19.14 12.94c.04-.31.06-.63.06-.94s-.02-.63-.06-.94l2.03-1.58a.5.5 0 0 0 .12-.64l-1.92-3.32a.5.5 0 0 0-.6-.22l-2.39.96a7.25 7.25 0 0 0-1.63-.94l-.36-2.54a.5.5 0 0 0-.49-.42h-3.84a.5.5 0 0 0-.49.42l-.36 2.54c-.58.22-1.13.53-1.63.94l-2.39-.96a.5.5 0 0 0-.6.22L2.71 8.84a.5.5 0 0 0 .12.64l2.03 1.58c-.04.31-.06.63-.06.94s.02.63.06.94L2.83 14.52a.5.5 0 0 0-.12.64l1.92 3.32a.5.5 0 0 0 .6.22l2.39-.96c.5.41 1.05.72 1.63.94l.36 2.54c.05.24.25.42.49.42h3.84c.24 0 .44-.18.49-.42l.36-2.54c.58-.22 1.13-.53 1.63-.94l2.39.96a.5.5 0 0 0 .6-.22l1.92-3.32a.5.5 0 0 0-.12-.64l-2.03-1.58zM12 15.5A3.5 3.5 0 1 1 12 8.5a3.5 3.5 0 0 1 0 7z" />
    </svg>
  )
}

function IconRestart() {
  return (
    <svg
      width={15}
      height={15}
      viewBox="0 0 24 24"
      aria-hidden
      fill="currentColor">
      <path d="M12 6V3L8 7l4 4V8c2.76 0 5 2.24 5 5a5 5 0 0 1-9.9 1h-2.02A7 7 0 1 0 12 6z" />
    </svg>
  )
}

type Match3ScreenProps = {
  selectedLevelId?: string
  goalScore?: number
  limitMode?: GameLimitMode
  moveLimit?: MoveLimitOption
  boardSize?: BoardSizeOption
  themeOption?: GameThemeOption
  durationSec?: GameDurationOption
  tileKinds?: number
  iconThemeOption?: GameIconThemeOption
  /** Оформление клеток и рамки: космос или светлое поле под еду. */
  boardFieldTheme?: BoardFieldThemeOption
  soundEnabled?: boolean
  /** Полный VFX или упрощённый (без частиц, тряски и «петард» по контуру). */
  vfxQuality?: GameVfxQualityOption
  hintIdleMs?: number
  playerHintsMode?: PlayerHintsMode
  onOpenSettings?: () => void
  forcePlayMode?: boolean
  onGameFinished?: (
    payload: GameEndPayload
  ) => void
}

export const Match3Screen: React.FC<
  Match3ScreenProps
> = ({
  selectedLevelId = DEFAULT_MATCH3_LEVEL_ID,
  goalScore,
  limitMode = 'moves',
  moveLimit = 75,
  boardSize,
  themeOption,
  durationSec,
  tileKinds,
  iconThemeOption = 'cosmic',
  boardFieldTheme = 'space',
  soundEnabled = true,
  vfxQuality = 'full',
  hintIdleMs,
  playerHintsMode = 'always',
  onOpenSettings,
  forcePlayMode = false,
  onGameFinished,
}) => {
  const canvasRef =
    useRef<HTMLCanvasElement | null>(null)
  const fxCanvasRef =
    useRef<HTMLCanvasElement | null>(null)
  const gameRef = useRef<ReturnType<
    typeof createMatch3Game
  > | null>(null)

  const [hud, setHud] = useState<GameHudState>({
    score: 0,
    moves: 0,
    currentCombo: 0,
    maxCombo: 0,
    playerRecord: 0,
    dailyRecord: 0,
    goalScore: 0,
    goalProgressPct: 0,
    goalTargetsTotal: 0,
    goalTargetsLeft: 0,
    timeLeftSec: GAME_DURATION_SEC,
  })

  const [uiPhase, setUiPhase] = useState<UiPhase>(
    forcePlayMode ? 'playing' : 'countdown'
  )
  const [countdownVal, setCountdownVal] =
    useState(PRESTART_COUNTDOWN_SEC)
  const [resultSnapshot, setResultSnapshot] =
    useState<GameHudState | null>(null)
  const [gameEndReason, setGameEndReason] =
    useState<GameEndPayload['reason'] | null>(
      null
    )
  const [boardShakeLevel, setBoardShakeLevel] =
    useState<'off' | 'light' | 'strong'>('off')
  const [borderSpark, setBorderSpark] = useState<
    'off' | 'line4plus' | 'tOrL'
  >('off')
  const [sparkBurstId, setSparkBurstId] =
    useState(0)
  const [coachStep, setCoachStep] = useState(0)
  const [showKeyboardHint, setShowKeyboardHint] =
    useState(false)
  const [
    comboSuccessCount,
    setComboSuccessCount,
  ] = useState(0)
  const [
    showIdleCoachHint,
    setShowIdleCoachHint,
  ] = useState(false)
  const [
    isRookieTutorialActive,
    setIsRookieTutorialActive,
  ] = useState(false)
  const [
    isRookieTutorialCompleted,
    setIsRookieTutorialCompleted,
  ] = useState(false)
  const [
    playingElapsedSec,
    setPlayingElapsedSec,
  ] = useState(0)
  const [hintsHidden, setHintsHidden] =
    useState(false)
  const shakeResetRef = useRef<number | null>(
    null
  )
  const sparkResetRef = useRef<number | null>(
    null
  )
  const idleCoachTimerRef = useRef<number | null>(
    null
  )
  const prevScoreRef = useRef(0)
  const playSessionTrackedRef = useRef(false)

  const onComboShake = useCallback(
    (chain: number) => {
      if (chain < 3) return
      if (shakeResetRef.current !== null) {
        window.clearTimeout(shakeResetRef.current)
      }
      setBoardShakeLevel(
        chain >= 5 ? 'strong' : 'light'
      )
      shakeResetRef.current = window.setTimeout(
        () => {
          setBoardShakeLevel('off')
          shakeResetRef.current = null
        },
        480
      )
    },
    []
  )

  const onPremiumMatchBorder = useCallback(
    (shape: 'line4plus' | 'tOrL') => {
      if (sparkResetRef.current !== null) {
        window.clearTimeout(sparkResetRef.current)
      }
      setBorderSpark(shape)
      setSparkBurstId(v => v + 1)
      sparkResetRef.current = window.setTimeout(
        () => {
          setBorderSpark('off')
          sparkResetRef.current = null
        },
        BORDER_SPARK_CLEAR_MS
      )
    },
    []
  )

  useEffect(() => {
    const canvas = canvasRef.current
    const fxCanvas = fxCanvasRef.current
    if (!canvas) return

    const game = createMatch3Game({
      canvas,
      fxCanvas: fxCanvas ?? undefined,
      vfxQuality,
      onHudChange: setHud,
      onComboShake,
      onPremiumMatchBorder,
      onGameEnd: payload => {
        if (forcePlayMode && onGameFinished) {
          onGameFinished(payload)
          return
        }
        setResultSnapshot(payload.snapshot)
        setGameEndReason(payload.reason)
        setUiPhase('results')
      },
    })

    gameRef.current = game
    if (forcePlayMode) {
      game.startPlay()
    }

    return () => {
      if (shakeResetRef.current !== null) {
        window.clearTimeout(shakeResetRef.current)
        shakeResetRef.current = null
      }
      if (sparkResetRef.current !== null) {
        window.clearTimeout(sparkResetRef.current)
        sparkResetRef.current = null
      }
      game.destroy()
      gameRef.current = null
    }
  }, [
    forcePlayMode,
    onGameFinished,
    onComboShake,
    onPremiumMatchBorder,
  ])

  useEffect(() => {
    const game = gameRef.current
    if (!game) return
    game.setVfxQuality(vfxQuality)
  }, [vfxQuality])

  useEffect(() => {
    if (forcePlayMode || uiPhase !== 'countdown')
      return
    if (countdownVal <= 0) {
      setUiPhase('ready')
      return
    }
    const id = window.setTimeout(() => {
      setCountdownVal(c => c - 1)
    }, 1000)
    return () => clearTimeout(id)
  }, [forcePlayMode, uiPhase, countdownVal])

  const selectedLevel = useMemo(
    () => getMatch3LevelById(selectedLevelId),
    [selectedLevelId]
  )
  const appliedLevel = useMemo(
    () => ({
      ...selectedLevel,
      goalValue:
        goalScore ?? selectedLevel.goalValue,
      boardSize:
        boardSize ?? selectedLevel.boardSize,
      theme: themeOption ?? selectedLevel.theme,
      durationSec:
        durationSec ?? selectedLevel.durationSec,
      tileKinds:
        tileKinds ?? selectedLevel.tileKinds,
    }),
    [
      selectedLevel,
      goalScore,
      boardSize,
      themeOption,
      durationSec,
      tileKinds,
    ]
  )

  useEffect(() => {
    const game = gameRef.current
    if (!game) return
    game.setLevel(appliedLevel)
  }, [appliedLevel])

  useEffect(() => {
    const game = gameRef.current
    if (!game) return
    game.setLimitMode(limitMode)
    game.setMoveLimit(moveLimit)
  }, [limitMode, moveLimit])

  useEffect(() => {
    const game = gameRef.current
    if (!game || !hintIdleMs) return
    game.setHintIdleMs(hintIdleMs)
  }, [hintIdleMs])

  useEffect(() => {
    const game = gameRef.current
    if (!game) return
    game.setIconTheme(iconThemeOption)
  }, [iconThemeOption])

  useEffect(() => {
    const game = gameRef.current
    if (!game) return
    game.setBoardField(boardFieldTheme)
  }, [boardFieldTheme])

  useEffect(() => {
    const game = gameRef.current
    if (!game) return
    game.setSoundEnabled(soundEnabled)
  }, [soundEnabled])

  useEffect(() => {
    if (uiPhase !== 'playing') {
      playSessionTrackedRef.current = false
      setPlayingElapsedSec(0)
      return
    }
    const timer = window.setInterval(() => {
      setPlayingElapsedSec(v => v + 1)
    }, 1000)
    return () => window.clearInterval(timer)
  }, [uiPhase])

  useEffect(() => {
    if (playerHintsMode === 'never') {
      setHintsHidden(true)
      try {
        window.localStorage.setItem(
          MATCH3_HINTS_HIDDEN_KEY,
          '1'
        )
      } catch {
        // noop
      }
      return
    }
    setHintsHidden(false)
    try {
      window.localStorage.setItem(
        MATCH3_HINTS_HIDDEN_KEY,
        '0'
      )
    } catch {
      // noop
    }
  }, [playerHintsMode])

  useEffect(() => {
    if (uiPhase !== 'playing') return
    if (playSessionTrackedRef.current) return
    playSessionTrackedRef.current = true
    if (selectedLevel.id !== 'rookie') {
      setIsRookieTutorialActive(false)
      setIsRookieTutorialCompleted(false)
      return
    }

    let nextGamesCount = 1
    try {
      const raw = window.localStorage.getItem(
        ROOKIE_TUTORIAL_GAMES_KEY
      )
      const prevCount = Number(raw || '0')
      nextGamesCount =
        Number.isFinite(prevCount) &&
        prevCount > 0
          ? prevCount + 1
          : 1
      window.localStorage.setItem(
        ROOKIE_TUTORIAL_GAMES_KEY,
        String(nextGamesCount)
      )
      if (
        nextGamesCount > ROOKIE_TUTORIAL_MAX_GAMES
      ) {
        window.localStorage.setItem(
          ROOKIE_TUTORIAL_DONE_KEY,
          '1'
        )
      }
    } catch {
      nextGamesCount = 1
    }
    setIsRookieTutorialActive(
      nextGamesCount <= ROOKIE_TUTORIAL_MAX_GAMES
    )
    setIsRookieTutorialCompleted(
      nextGamesCount > ROOKIE_TUTORIAL_MAX_GAMES
    )
  }, [uiPhase, selectedLevel.id])

  useEffect(() => {
    if (uiPhase !== 'playing') return
    setCoachStep(0)
    const first = window.setTimeout(() => {
      setCoachStep(1)
    }, 3000)
    const second = window.setTimeout(() => {
      setCoachStep(2)
    }, 6000)
    return () => {
      window.clearTimeout(first)
      window.clearTimeout(second)
    }
  }, [uiPhase])

  useEffect(() => {
    if (uiPhase !== 'playing') {
      setShowKeyboardHint(false)
      setShowIdleCoachHint(false)
      setComboSuccessCount(0)
      prevScoreRef.current = 0
      return
    }
    prevScoreRef.current = 0
  }, [uiPhase])

  useEffect(() => {
    if (uiPhase !== 'playing') return
    if (hud.score <= prevScoreRef.current) return
    setComboSuccessCount(v => v + 1)
    setShowIdleCoachHint(false)
    prevScoreRef.current = hud.score
  }, [hud.score, uiPhase])

  useEffect(() => {
    if (comboSuccessCount >= 2) {
      setShowKeyboardHint(false)
    }
  }, [comboSuccessCount])

  useEffect(() => {
    if (uiPhase !== 'playing') return
    const canvas = canvasRef.current
    const onKeyDown = (ev: KeyboardEvent) => {
      if (document.activeElement !== canvas)
        return
      const isKeyboardControl =
        ev.code === 'Enter' ||
        ev.code === 'Space' ||
        ev.code === 'ArrowUp' ||
        ev.code === 'ArrowDown' ||
        ev.code === 'ArrowLeft' ||
        ev.code === 'ArrowRight' ||
        ev.code === 'KeyW' ||
        ev.code === 'KeyA' ||
        ev.code === 'KeyS' ||
        ev.code === 'KeyD'
      if (!isKeyboardControl) return
      if (comboSuccessCount < 2) {
        setShowKeyboardHint(true)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () =>
      window.removeEventListener(
        'keydown',
        onKeyDown
      )
  }, [uiPhase, comboSuccessCount])

  useEffect(() => {
    if (uiPhase !== 'playing') return
    const canvas = canvasRef.current
    const resetIdleCoachTimer = () => {
      if (idleCoachTimerRef.current !== null) {
        window.clearTimeout(
          idleCoachTimerRef.current
        )
      }
      setShowIdleCoachHint(false)
      idleCoachTimerRef.current =
        window.setTimeout(() => {
          setShowIdleCoachHint(true)
        }, 10000)
    }

    resetIdleCoachTimer()
    const onKeyDown = () => {
      resetIdleCoachTimer()
    }
    const onPointerDown = () => {
      resetIdleCoachTimer()
    }
    window.addEventListener('keydown', onKeyDown)
    canvas?.addEventListener(
      'pointerdown',
      onPointerDown
    )
    return () => {
      if (idleCoachTimerRef.current !== null) {
        window.clearTimeout(
          idleCoachTimerRef.current
        )
        idleCoachTimerRef.current = null
      }
      window.removeEventListener(
        'keydown',
        onKeyDown
      )
      canvas?.removeEventListener(
        'pointerdown',
        onPointerDown
      )
    }
  }, [uiPhase])

  const timeLabel = useMemo(() => {
    const mm = String(
      Math.floor(hud.timeLeftSec / 60)
    ).padStart(2, '0')
    const ss = String(
      hud.timeLeftSec % 60
    ).padStart(2, '0')
    return `${mm}:${ss}`
  }, [hud.timeLeftSec])
  const remainingLabel =
    limitMode === 'moves'
      ? `${Math.max(moveLimit - hud.moves, 0)}`
      : timeLabel
  const hudHintText =
    playerHintsMode === 'pauses'
      ? showIdleCoachHint
        ? isRookieTutorialActive &&
          playingElapsedSec >= 30
          ? 'Совет новичку: ищите двойные комбинации и ходы внизу поля — каскады дают больше очков'
          : 'Пауза в игре: проверьте нижние ряды и возможные каскады'
        : ''
      : showKeyboardHint
      ? 'Enter или Space - выбор, Стрелки - переход к цели'
      : showIdleCoachHint
      ? isRookieTutorialActive &&
        playingElapsedSec >= 30
        ? 'Совет новичку: ищите двойные комбинации и ходы внизу поля — каскады дают больше очков'
        : 'Следите за подсказками, чтобы не пропустить комбинацию'
      : isRookieTutorialActive &&
        playingElapsedSec >= 35 &&
        comboSuccessCount < 2
      ? 'Совет новичку: комбинации 4+ и бомбы/ракеты ускоряют набор очков'
      : isRookieTutorialActive &&
        playingElapsedSec >= 20 &&
        comboSuccessCount === 0
      ? 'Совет новичку: начинайте с нижней части поля, чтобы чаще запускать каскады'
      : COACH_MESSAGES[
          Math.min(
            coachStep,
            COACH_MESSAGES.length - 1
          )
        ]
  const shouldShowHudHints =
    !hintsHidden &&
    (playerHintsMode !== 'pauses' ||
      showIdleCoachHint)

  const handleHideHints = () => {
    setHintsHidden(true)
    try {
      window.localStorage.setItem(
        MATCH3_HINTS_HIDDEN_KEY,
        '1'
      )
    } catch {
      // noop: optional persistence
    }
  }

  const handlePlay = () => {
    setUiPhase('playing')
    gameRef.current?.startPlay()
  }

  const handlePlayAgain = () => {
    setResultSnapshot(null)
    setGameEndReason(null)
    setCountdownVal(PRESTART_COUNTDOWN_SEC)
    setUiPhase('countdown')
    gameRef.current?.resetIdle()
  }
  const handleRestartFromHud = () => {
    if (uiPhase !== 'playing') return
    gameRef.current?.resetIdle()
    if (forcePlayMode) {
      gameRef.current?.startPlay()
      return
    }
    setResultSnapshot(null)
    setGameEndReason(null)
    setCountdownVal(PRESTART_COUNTDOWN_SEC)
    setUiPhase('countdown')
  }

  const resultStats = useMemo(() => {
    if (!resultSnapshot) return null
    const isWin =
      gameEndReason === 'goalReached' ||
      (resultSnapshot.goalScore > 0 &&
        resultSnapshot.score >=
          resultSnapshot.goalScore &&
        resultSnapshot.goalTargetsLeft <= 0)
    const goalRemain = Math.max(
      0,
      resultSnapshot.goalScore -
        resultSnapshot.score
    )
    const comboBonus =
      resultSnapshot.maxCombo * 25
    const timeBonus =
      resultSnapshot.timeLeftSec * 2
    const totalWithBonus =
      resultSnapshot.score +
      comboBonus +
      timeBonus
    return {
      isWin,
      goalRemain,
      targetsRemain:
        resultSnapshot.goalTargetsLeft,
      comboBonus,
      timeBonus,
      totalWithBonus,
    }
  }, [resultSnapshot, gameEndReason])
  const isStartPhase =
    uiPhase === 'countdown' || uiPhase === 'ready'
  const showBoard = forcePlayMode || !isStartPhase

  return (
    <section
      className={
        'match3' +
        (isStartPhase ? ' match3--start' : '')
      }>
      <div
        className={
          'match3__arena' +
          (uiPhase === 'playing'
            ? ' match3__arena--playing'
            : '')
        }>
        {uiPhase === 'playing' && (
          <>
            <div className="match3__hud-top">
              <div className="match3__hud-mobile-item">
                <span>Счёт</span>
                <strong>{hud.score}</strong>
              </div>
              <div className="match3__hud-mobile-item">
                <span>Ходов</span>
                <strong>{hud.moves}</strong>
              </div>
              <div className="match3__hud-mobile-item">
                <span>Цель</span>
                <strong>
                  {Math.min(
                    hud.score,
                    hud.goalScore
                  )}
                  /{hud.goalScore}
                </strong>
              </div>
              {hud.goalTargetsTotal > 0 && (
                <div className="match3__hud-mobile-item">
                  <span>Метки</span>
                  <strong>
                    {hud.goalTargetsTotal -
                      hud.goalTargetsLeft}
                    /{hud.goalTargetsTotal}
                  </strong>
                </div>
              )}
              <div className="match3__hud-mobile-item">
                <span>Осталось</span>
                <strong>
                  {remainingLabel}
                  {limitMode === 'moves'
                    ? ' ход.'
                    : ''}
                </strong>
              </div>
              <button
                type="button"
                className="match3__hud-restart"
                onClick={handleRestartFromHud}
                aria-label="Начать заново"
                title="Начать заново">
                <IconRestart />
                <span>Заново</span>
              </button>
            </div>
            {shouldShowHudHints && (
              <div className="match3__hud-kbd-hint-wrap">
                {isRookieTutorialCompleted && (
                  <span className="match3__hud-tutorial-badge">
                    Обучение завершено
                  </span>
                )}
                <div className="match3__hud-kbd-hint">
                  {hudHintText}
                </div>
                {playerHintsMode === 'always' && (
                  <button
                    type="button"
                    className="match3__hud-hint-hide"
                    onClick={handleHideHints}
                    aria-label="Скрыть подсказки"
                    title="Скрыть подсказки">
                    ✕
                  </button>
                )}
              </div>
            )}
          </>
        )}

        {showBoard && uiPhase !== 'results' && (
          <div
            className={clsx(
              'match3__board-wrap',
              boardFieldTheme === 'food' &&
                'match3__board-wrap--food'
            )}>
            <div
              className={clsx(
                'match3__board',
                'match3__board--stack',
                (uiPhase === 'countdown' ||
                  uiPhase === 'ready') &&
                  'is-overlay-only',
                boardShakeLevel === 'light' &&
                  'match3__board--shake-light',
                boardShakeLevel === 'strong' &&
                  'match3__board--shake-strong'
              )}>
              <canvas
                ref={canvasRef}
                className="match3__canvas match3__canvas--board"
                width={480}
                height={480}
                aria-label="Игровое поле match-3"
              />
              <canvas
                ref={fxCanvasRef}
                className="match3__canvas match3__canvas--fx"
                width={480}
                height={480}
                aria-hidden
              />

              {uiPhase === 'countdown' &&
                countdownVal > 0 && (
                  <div
                    className="match3__overlay match3__overlay--countdown"
                    aria-live="polite">
                    <div className="match3__countdown">
                      {countdownVal}
                    </div>
                  </div>
                )}

              {uiPhase === 'ready' && (
                <div className="match3__overlay match3__overlay--ready">
                  <p className="match3__start-glow-note">
                    Cosmic Match: комбинируй,
                    набирай очки, закрывай цель!
                  </p>
                  <div className="match3__start-info">
                    <div>
                      Уровень:{' '}
                      {appliedLevel.title}
                    </div>
                    <div>
                      Цель:{' '}
                      {appliedLevel.goalValue}{' '}
                      очков
                    </div>
                    {appliedLevel.targetCells &&
                      appliedLevel.targetCells >
                        0 && (
                        <div>
                          Меток для бомб:{' '}
                          {
                            appliedLevel.targetCells
                          }
                        </div>
                      )}
                    <div>
                      Поле:{' '}
                      {appliedLevel.boardSize}x
                      {appliedLevel.boardSize}
                    </div>
                    <div>
                      Поле:{' '}
                      {boardFieldTheme === 'food'
                        ? 'Еда'
                        : 'Космос'}
                    </div>
                    <div>
                      {limitMode === 'moves'
                        ? `Ходы: ${moveLimit}`
                        : `Время: ${
                            appliedLevel.durationSec /
                            60
                          } мин`}
                    </div>
                    <div>
                      Типов фишек:{' '}
                      {appliedLevel.tileKinds}
                    </div>
                  </div>
                  <div className="match3__start-actions">
                    <button
                      type="button"
                      className="btn btn--outline match3__settings-play-btn"
                      onClick={() =>
                        onOpenSettings?.()
                      }>
                      <IconSettings />
                      Настройки
                    </button>
                    <button
                      type="button"
                      className="btn btn--primary match3__play-btn"
                      onClick={handlePlay}>
                      Играть
                    </button>
                  </div>
                </div>
              )}
            </div>
            {borderSpark !== 'off' && (
              <div
                key={sparkBurstId}
                className="match3__board-sparks"
                aria-hidden>
                {BORDER_SPARK_POSITIONS.map(
                  (pos, i) => (
                    <span
                      key={i}
                      className={
                        'match3__spark-dot ' +
                        (borderSpark ===
                        'line4plus'
                          ? 'match3__spark-dot--line4'
                          : 'match3__spark-dot--tl')
                      }
                      style={{
                        left: pos.left,
                        top: pos.top,
                        animationDelay: `${
                          i * BORDER_SPARK_STEP_MS
                        }ms`,
                      }}
                    />
                  )
                )}
              </div>
            )}
          </div>
        )}

        {uiPhase === 'results' && resultSnapshot && (
          <div className="match3__overlay match3__overlay--results">
            <h3 className="match3__results-title">
              {resultStats?.isWin
                ? 'Вы выиграли!'
                : 'Можно лучше'}
            </h3>
            <p
              className={
                'match3__results-verdict ' +
                (resultStats?.isWin
                  ? 'is-win'
                  : 'is-lose')
              }>
              {resultStats?.isWin
                ? 'Цель уровня выполнена'
                : gameEndReason === 'timeOut'
                ? 'Время вышло, цель не достигнута'
                : gameEndReason === 'movesOut'
                ? 'Ходы закончились, цель не достигнута'
                : 'Цель не достигнута'}
            </p>
            <ul className="match3__results-list">
              <li>
                Счёт: {resultSnapshot.score}
              </li>
              <li>
                Цель: {resultSnapshot.goalScore}
              </li>
              <li>
                Ходов: {resultSnapshot.moves}
                {limitMode === 'moves'
                  ? ` / ${moveLimit}`
                  : ''}
              </li>
              <li>
                Прогресс цели:{' '}
                {Math.min(
                  resultSnapshot.score,
                  resultSnapshot.goalScore
                )}{' '}
                / {resultSnapshot.goalScore}
              </li>
              <li>
                Осталось до цели:{' '}
                {resultStats?.goalRemain ?? 0}
              </li>
              {resultSnapshot.goalTargetsTotal >
                0 && (
                <li>
                  Осталось меток:{' '}
                  {resultStats?.targetsRemain ??
                    0}
                </li>
              )}
              <li>
                Лучшее комбо: x
                {resultSnapshot.maxCombo}
              </li>
              <li>
                Бонус за комбо: +
                {resultStats?.comboBonus ?? 0}
              </li>
              <li>
                Бонус за время: +
                {resultStats?.timeBonus ?? 0}
              </li>
              <li>
                Итог с бонусами:{' '}
                {resultStats?.totalWithBonus ?? 0}
              </li>
              <li>
                Ваш рекорд:{' '}
                {resultSnapshot.playerRecord}
              </li>
            </ul>
            <button
              type="button"
              className="btn btn--primary match3__again-btn"
              onClick={handlePlayAgain}>
              Сыграть снова
            </button>
          </div>
        )}
      </div>
    </section>
  )
}
