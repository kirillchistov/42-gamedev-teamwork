// Временный адаптер

export type GameHudState = {
  score: number
  moves: number
  maxCombo: number
  playerRecord: number
  dailyRecord: number
  timeLeftSec: number
}

type ScoreMode = 'x1' | 'x2' | 'x3'

type CreateParams = {
  canvas: HTMLCanvasElement
  onHudChange?: (next: GameHudState) => void
}

export function createMatch3Game(
  params: CreateParams
) {
  const { onHudChange } = params

  const hud: GameHudState = {
    score: 0,
    moves: 0,
    maxCombo: 0,
    playerRecord: 0,
    dailyRecord: 0,
    timeLeftSec: 300,
  }

  let boardSize = 8
  let scoreMode: ScoreMode = 'x1'
  let timerId: number | null = null

  const emitHud = () => onHudChange?.({ ...hud })

  const startPrestart = () => {
    emitHud()
  }

  const setBoardSize = (size: number) => {
    boardSize = size
    void boardSize
    emitHud()
  }

  const setScoreMode = (mode: ScoreMode) => {
    scoreMode = mode
    void scoreMode
    emitHud()
  }

  const destroy = () => {
    if (timerId !== null) {
      window.clearInterval(timerId)
      timerId = null
    }
  }

  return {
    startPrestart,
    setBoardSize,
    setScoreMode,
    destroy,
  }
}
