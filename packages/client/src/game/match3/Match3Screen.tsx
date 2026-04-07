/**
 * Match3Screen управляет пользовательскими фазами экрана: отсчёт, готовность, игра и результаты.
 * Компонент создаёт экземпляр игры один раз и подписывается на обновления HUD через onHudChange.
 * В этом файле нет бизнес-логики match-3: он только связывает движок с JSX и показывает нужные оверлеи.
 * Благодаря такой структуре UI можно менять независимо от логики в engine/bootstrap.ts.
 * 6.1.2 Игровые настройки перед стартом:
 * Вместо текстовой заглушки добавлены рабочие контролы:
 * Размер поля (select: 8/12/16/20)
 * Тема (select: Стандарт/Космос/Математика)
 * Время (select: 3/5/10 мин)
 * Через useEffect настройки прокидываются в движок: setBoardSize, setDuration, setTheme
 * 6.1.3 Модели уровней:
 * Объединил настройки в выбор уровня. На старте видно: цель, поле, тему, время, # фишек
 * 6.1.4 Улучшение HUD:
 * В HUD в фазе playing добавил: goalProgressPct, currentCombo, maxCombo
 * В results-оверлей добавил: прогресс цели и лучший комбо
 * 6.1.9 Экран результата уровня
 * Сохраняю gameEndReason. В results-оверлее: заголовок: Победа! / Поражение,
 * текст-вердикт: “Цель уровня выполнена” или “Время вышло, цель не достигнута”
 * Добавил итоговые показатели: цель, прогресс, сколько осталось до цели,
 * бонус за комбо (maxCombo * 25),  * бонус за оставшееся время (timeLeftSec * 2)
 * итог с бонусами
 * 6.3.1 VFX при матче (частицы + вспышка):
 * Второй canvas (match3__canvas--fx) поверх поля, pointer-events: none
 * createMatch3Game({ canvas, fxCanvas }) — тот же размер 480×480, общий стек match3__board--stack
 * 6.3.3 Улучшенный HUD (сбоку на ПК, компактная шапка в мобильной версии)
 */

import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import './match3.pcss'
import {
  createMatch3Game,
  type GameEndPayload,
  type GameHudState,
} from './engine/bootstrap'
import {
  PRESTART_COUNTDOWN_SEC,
  type BoardSizeOption,
  type GameDurationOption,
  type GameThemeOption,
} from './engine/config'
import {
  DEFAULT_MATCH3_LEVEL_ID,
  getMatch3LevelById,
  type LevelGoalType,
} from './engine/levels'

type UiPhase =
  | 'countdown'
  | 'ready'
  | 'playing'
  | 'results'

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
  goalType?: LevelGoalType
  boardSize?: BoardSizeOption
  themeOption?: GameThemeOption
  durationSec?: GameDurationOption
  tileKinds?: number
  hintIdleMs?: number
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
  goalType = 'score',
  boardSize,
  themeOption,
  durationSec,
  tileKinds,
  hintIdleMs,
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
    timeLeftSec: 300,
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
  useEffect(() => {
    const canvas = canvasRef.current
    const fxCanvas = fxCanvasRef.current
    if (!canvas) return

    const game = createMatch3Game({
      canvas,
      fxCanvas: fxCanvas ?? undefined,
      onHudChange: setHud,
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
      game.destroy()
      gameRef.current = null
    }
  }, [forcePlayMode, onGameFinished])

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
    if (!game || !hintIdleMs) return
    game.setHintIdleMs(hintIdleMs)
  }, [hintIdleMs])

  const timeLabel = useMemo(() => {
    const mm = String(
      Math.floor(hud.timeLeftSec / 60)
    ).padStart(2, '0')
    const ss = String(
      hud.timeLeftSec % 60
    ).padStart(2, '0')
    return `${mm}:${ss}`
  }, [hud.timeLeftSec])

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
          resultSnapshot.goalScore)
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
      comboBonus,
      timeBonus,
      totalWithBonus,
    }
  }, [resultSnapshot, gameEndReason])
  const goalPct =
    hud.goalScore > 0
      ? `${hud.goalProgressPct}%`
      : '—'
  const isStartPhase =
    uiPhase === 'countdown' || uiPhase === 'ready'
  const showBoard = forcePlayMode || !isStartPhase

  return (
    <section
      className={
        'match3' +
        (isStartPhase ? ' match3--start' : '')
      }>
      <div className="match3__arena">
        {uiPhase === 'playing' && (
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
              <strong>{goalPct}</strong>
            </div>
            <div className="match3__hud-mobile-item">
              <span>Время</span>
              <strong>{timeLabel}</strong>
            </div>
            <button
              type="button"
              className="match3__hud-restart"
              onClick={handleRestartFromHud}
              aria-label="Начать заново"
              title="Начать заново">
              <IconRestart />
              <span>Начать заново</span>
            </button>
          </div>
        )}

        {showBoard && uiPhase !== 'results' && (
          <div
            className={
              'match3__board match3__board--stack' +
              (uiPhase === 'countdown' ||
              uiPhase === 'ready'
                ? ' is-overlay-only'
                : '')
            }>
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
                  набирай очки, побеждай время!
                </p>
                <div className="match3__start-info">
                  <div>
                    Уровень: {appliedLevel.title}
                  </div>
                  <div>
                    Цель:{' '}
                    {goalType === 'score'
                      ? `${appliedLevel.goalValue} очков`
                      : '—'}
                  </div>
                  <div>
                    Поле: {appliedLevel.boardSize}
                    x{appliedLevel.boardSize}
                  </div>
                  <div>
                    Тема:{' '}
                    {appliedLevel.theme ===
                    'standard'
                      ? 'Стандарт'
                      : appliedLevel.theme ===
                        'space'
                      ? 'Космос'
                      : 'Математика'}
                  </div>
                  <div>
                    Время:{' '}
                    {appliedLevel.durationSec /
                      60}{' '}
                    мин
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
              </li>
              <li>
                Прогресс цели:{' '}
                {resultSnapshot.goalProgressPct}%
              </li>
              <li>
                Осталось до цели:{' '}
                {resultStats?.goalRemain ?? 0}
              </li>
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
