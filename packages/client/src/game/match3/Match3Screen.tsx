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
  type GameHudState,
} from './engine/bootstrap'
import {
  BOARD_SIZE_OPTIONS,
  GAME_DURATION_OPTIONS,
  GAME_THEME_OPTIONS,
  GAME_DURATION_SEC,
  BOARD_SIZE,
  PRESTART_COUNTDOWN_SEC,
  type BoardSizeOption,
  type GameDurationOption,
  type GameThemeOption,
} from './engine/config'

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
    maxCombo: 0,
    playerRecord: 0,
    dailyRecord: 0,
    timeLeftSec: 300,
  })

  const [uiPhase, setUiPhase] =
    useState<UiPhase>('countdown')
  const [countdownVal, setCountdownVal] =
    useState(PRESTART_COUNTDOWN_SEC)
  const [resultSnapshot, setResultSnapshot] =
    useState<GameHudState | null>(null)
  const [boardSize, setBoardSize] =
    useState<BoardSizeOption>(BOARD_SIZE)
  const [durationSec, setDurationSec] =
    useState<GameDurationOption>(
      GAME_DURATION_SEC
    )
  const [theme, setTheme] =
    useState<GameThemeOption>('standard')

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const game = createMatch3Game({
      canvas,
      onHudChange: setHud,
      onGameEnd: snapshot => {
        setResultSnapshot(snapshot)
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

  useEffect(() => {
    const game = gameRef.current
    if (!game) return
    game.setBoardSize(boardSize)
  }, [boardSize])

  useEffect(() => {
    const game = gameRef.current
    if (!game) return
    game.setDuration(durationSec)
  }, [durationSec])

  useEffect(() => {
    const game = gameRef.current
    if (!game) return
    game.setTheme(theme)
  }, [theme])

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
    setCountdownVal(PRESTART_COUNTDOWN_SEC)
    setUiPhase('countdown')
    gameRef.current?.resetIdle()
  }

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
              Поле:{' '}
              <select
                value={String(boardSize)}
                onChange={e =>
                  setBoardSize(
                    Number(
                      e.target.value
                    ) as BoardSizeOption
                  )
                }>
                {BOARD_SIZE_OPTIONS.map(size => (
                  <option key={size} value={size}>
                    {size}x{size}
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
            <label className="match3__setting">
              Тема:{' '}
              <select
                value={theme}
                onChange={e =>
                  setTheme(
                    e.target
                      .value as GameThemeOption
                  )
                }>
                {GAME_THEME_OPTIONS.map(item => (
                  <option key={item} value={item}>
                    {item === 'standard'
                      ? 'Стандарт'
                      : item === 'space'
                      ? 'Космос'
                      : 'Математика'}
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
            <label className="match3__setting">
              Время:{' '}
              <select
                value={String(durationSec)}
                onChange={e =>
                  setDurationSec(
                    Number(
                      e.target.value
                    ) as GameDurationOption
                  )
                }>
                {GAME_DURATION_OPTIONS.map(
                  item => (
                    <option
                      key={item}
                      value={item}>
                      {item / 60} мин
                    </option>
                  )
                )}
              </select>
            </label>
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
              Партия завершена
            </h3>
            <ul className="match3__results-list">
              <li>
                Счёт: {resultSnapshot.score}
              </li>
              <li>
                Ходов: {resultSnapshot.moves}
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
