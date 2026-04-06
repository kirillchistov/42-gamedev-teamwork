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
import { PRESTART_COUNTDOWN_SEC } from './engine/config'
import {
  DEFAULT_MATCH3_LEVEL_ID,
  getMatch3LevelById,
  MATCH3_LEVELS,
} from './engine/levels'

type UiPhase =
  | 'countdown'
  | 'ready'
  | 'playing'
  | 'results'

export const Match3Screen: React.FC = () => {
  const canvasRef =
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

  const [uiPhase, setUiPhase] =
    useState<UiPhase>('countdown')
  const [countdownVal, setCountdownVal] =
    useState(PRESTART_COUNTDOWN_SEC)
  const [resultSnapshot, setResultSnapshot] =
    useState<GameHudState | null>(null)
  const [gameEndReason, setGameEndReason] =
    useState<GameEndPayload['reason'] | null>(
      null
    )
  const [selectedLevelId, setSelectedLevelId] =
    useState(DEFAULT_MATCH3_LEVEL_ID)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const game = createMatch3Game({
      canvas,
      onHudChange: setHud,
      onGameEnd: payload => {
        setResultSnapshot(payload.snapshot)
        setGameEndReason(payload.reason)
        setUiPhase('results')
      },
    })

    gameRef.current = game

    return () => {
      game.destroy()
      gameRef.current = null
    }
  }, [])

  useEffect(() => {
    if (uiPhase !== 'countdown') return
    if (countdownVal <= 0) {
      setUiPhase('ready')
      return
    }
    const id = window.setTimeout(() => {
      setCountdownVal(c => c - 1)
    }, 1000)
    return () => clearTimeout(id)
  }, [uiPhase, countdownVal])

  const selectedLevel = useMemo(
    () => getMatch3LevelById(selectedLevelId),
    [selectedLevelId]
  )

  useEffect(() => {
    const game = gameRef.current
    if (!game) return
    game.setLevel(selectedLevel)
  }, [selectedLevel])

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

  return (
    <section className="match3">
      {uiPhase === 'playing' && (
        <div className="match3__hud match3__hud--row">
          <span>Счёт: {hud.score}</span>
          <span
            className="match3__hud-sep"
            aria-hidden>
            |
          </span>
          <span>Ходов: {hud.moves}</span>
          <span
            className="match3__hud-sep"
            aria-hidden>
            |
          </span>
          <span>
            Цель:{' '}
            {hud.goalScore > 0
              ? `${hud.goalProgressPct}%`
              : '—'}
          </span>
          <span
            className="match3__hud-sep"
            aria-hidden>
            |
          </span>
          <span>
            Комбо: x{hud.currentCombo || 1}
          </span>
          <span
            className="match3__hud-sep"
            aria-hidden>
            |
          </span>
          <span>
            Лучшее комбо: x{hud.maxCombo}
          </span>
          <span
            className="match3__hud-sep"
            aria-hidden>
            |
          </span>
          <span>
            Ваш рекорд: {hud.playerRecord}
          </span>
          <span
            className="match3__hud-sep"
            aria-hidden>
            |
          </span>
          <span>Время: {timeLabel}</span>
        </div>
      )}

      {(uiPhase === 'countdown' ||
        uiPhase === 'ready') && (
        <div className="match3__pre-hud">
          Ваш рекорд: {hud.playerRecord}
        </div>
      )}

      {(uiPhase === 'countdown' ||
        uiPhase === 'ready') && (
        <div className="match3__start-settings">
          <span>
            <label className="match3__setting">
              Уровень:{' '}
              <select
                value={selectedLevelId}
                onChange={e =>
                  setSelectedLevelId(
                    e.target.value
                  )
                }>
                {MATCH3_LEVELS.map(level => (
                  <option
                    key={level.id}
                    value={level.id}>
                    {level.title}
                  </option>
                ))}
              </select>
            </label>
          </span>
          <span
            className="match3__hud-sep"
            aria-hidden>
            |
          </span>
          <span>
            Цель: набрать{' '}
            {selectedLevel.goalValue} очков
          </span>
          <span
            className="match3__hud-sep"
            aria-hidden>
            |
          </span>
          <span>
            Поле: {selectedLevel.boardSize}x
            {selectedLevel.boardSize}
          </span>
          <span
            className="match3__hud-sep"
            aria-hidden>
            |
          </span>
          <span>
            Тема:{' '}
            {selectedLevel.theme === 'standard'
              ? 'Стандарт'
              : selectedLevel.theme === 'space'
              ? 'Космос'
              : 'Математика'}
          </span>
          <span
            className="match3__hud-sep"
            aria-hidden>
            |
          </span>
          <span>
            Время:{' '}
            {selectedLevel.durationSec / 60} мин
          </span>
          <span
            className="match3__hud-sep"
            aria-hidden>
            |
          </span>
          <span>
            Типов фишек: {selectedLevel.tileKinds}
          </span>
        </div>
      )}

      <div className="match3__board">
        <canvas
          ref={canvasRef}
          className="match3__canvas"
          width={480}
          height={480}
          aria-label="Игровое поле match-3"
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
            <button
              type="button"
              className="btn btn--primary match3__play-btn"
              onClick={handlePlay}>
              Играть
            </button>
          </div>
        )}

        {uiPhase === 'results' && resultSnapshot && (
          <div className="match3__overlay match3__overlay--results">
            <h3 className="match3__results-title">
              {resultStats?.isWin
                ? 'Победа!'
                : 'Поражение'}
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
