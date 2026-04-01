/**
 * Match3Screen управляет пользовательскими фазами экрана: отсчёт, готовность, игра и результаты.
 * Компонент создаёт экземпляр игры один раз и подписывается на обновления HUD через onHudChange.
 * В этом файле нет бизнес-логики match-3: он только связывает движок с JSX и показывает нужные оверлеи.
 * Благодаря такой структуре UI можно менять независимо от логики в engine/bootstrap.ts.
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
  PRESTART_COUNTDOWN_SEC,
  BOARD_SIZE,
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
            Поле: {BOARD_SIZE}x{BOARD_SIZE}
          </span>
          <span
            className="match3__hud-sep"
            aria-hidden>
            |
          </span>
          <span>
            Тема: стандарт / космос / математика
          </span>
          <span
            className="match3__hud-sep"
            aria-hidden>
            |
          </span>
          <span>Время: 3 / 5 / 10 минут</span>
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
