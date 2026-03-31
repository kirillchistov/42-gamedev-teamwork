// Компонент Match3Screen для рендеринга игрового модуля
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

  const [settingsOpen, setSettingsOpen] =
    useState(false)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const game = createMatch3Game({
      canvas,
      onHudChange: setHud,
    })

    gameRef.current = game
    game.startPrestart()

    return () => {
      game.destroy()
      gameRef.current = null
    }
  }, [])

  const timeLabel = useMemo(() => {
    const mm = String(
      Math.floor(hud.timeLeftSec / 60)
    ).padStart(2, '0')
    const ss = String(
      hud.timeLeftSec % 60
    ).padStart(2, '0')
    return `${mm}:${ss}`
  }, [hud.timeLeftSec])

  return (
    <section className="match3">
      <div className="match3__hud">
        Счет: {hud.score} | Ходов: {hud.moves} |
        Комбо: {hud.maxCombo} | Игрок:{' '}
        {hud.playerRecord} | День:{' '}
        {hud.dailyRecord} | Время: {timeLabel}
      </div>

      <canvas
        ref={canvasRef}
        className="match3__canvas"
        width={400}
        height={400}
        aria-label="Игровое поле match-3"
      />

      <button
        type="button"
        className="match3__settings-toggle"
        aria-expanded={settingsOpen}
        onClick={() => setSettingsOpen(v => !v)}>
        {settingsOpen
          ? 'Скрыть настройки'
          : 'Настройки'}
      </button>

      {settingsOpen && (
        <div className="match3__settings">
          <label>
            Размер поля
            <select
              defaultValue="8"
              onChange={e =>
                gameRef.current?.setBoardSize(
                  Number(e.target.value)
                )
              }>
              <option value="8">8x8</option>
              <option value="12">12x12</option>
              <option value="16">16x16</option>
              <option value="20">20x20</option>
            </select>
          </label>

          <label>
            Множитель очков
            <select
              defaultValue="x1"
              onChange={e =>
                gameRef.current?.setScoreMode(
                  e.target.value as
                    | 'x1'
                    | 'x2'
                    | 'x3'
                )
              }>
              <option value="x1">
                Стандарт (x1)
              </option>
              <option value="x2">
                Ускоренный (x2)
              </option>
              <option value="x3">
                Экстрим (x3)
              </option>
            </select>
          </label>
        </div>
      )}
    </section>
  )
}
