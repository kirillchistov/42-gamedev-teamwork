/**
 * 6.1.1 Улучшить ядро игры: отделить логику от визуала
 * gameState - модуль состояния игры: здесь типы и чистые правила состояния:
 * GameHudState, Phase, ScoreMode, createInitialHud, resetHudForIdle / resetHudForPlay,
 * tileKindsForBoardSize, scoreMultiplier, createPlayableBoard
 * 6.1.3 Модели уровней:
 * createPlayableBoard теперь умеет принимать forcedTileKinds
 * 6.1.4 Улучшение HUD:
 * Расширил GameHudState: currentCombo, goalScore, goalProgressPct
 * Обновил createInitialHud/resetHudForIdle/resetHudForPlay под новые поля
 * Добавил хелпер syncGoalProgress(hud)
 */
import type { Board } from './core/grid'
import { createBoard } from './core/grid'
import {
  BOARD_SIZE_OPTIONS,
  GAME_DURATION_SEC,
  TILE_KINDS_BY_BOARD_SIZE,
  type BoardSizeOption,
} from './config'

export type GameHudState = {
  score: number
  moves: number
  currentCombo: number
  maxCombo: number
  playerRecord: number
  dailyRecord: number
  goalScore: number
  goalProgressPct: number
  timeLeftSec: number
}

export type ScoreMode = 'x1' | 'x2' | 'x3'

export type Phase = 'idle' | 'playing' | 'ended'

const SCORE_MULT: Record<ScoreMode, number> = {
  x1: 1,
  x2: 2,
  x3: 3,
}

function isBoardSize(
  n: number
): n is BoardSizeOption {
  return (
    BOARD_SIZE_OPTIONS as readonly number[]
  ).includes(n)
}

export function tileKindsForBoardSize(
  size: number
): number {
  if (isBoardSize(size))
    return TILE_KINDS_BY_BOARD_SIZE[size]
  return TILE_KINDS_BY_BOARD_SIZE[8]
}

export function scoreMultiplier(
  mode: ScoreMode
): number {
  return SCORE_MULT[mode]
}

export function createInitialHud(
  durationSec = GAME_DURATION_SEC
): GameHudState {
  return {
    score: 0,
    moves: 0,
    currentCombo: 0,
    maxCombo: 0,
    playerRecord: 0,
    dailyRecord: 0,
    goalScore: 0,
    goalProgressPct: 0,
    timeLeftSec: durationSec,
  }
}

export function resetHudForIdle(
  hud: GameHudState,
  params: {
    durationSec?: number
    playerRecord: number
    dailyRecord: number
    goalScore?: number
  }
): void {
  const durationSec =
    params.durationSec ?? GAME_DURATION_SEC
  hud.score = 0
  hud.moves = 0
  hud.currentCombo = 0
  hud.maxCombo = 0
  hud.timeLeftSec = durationSec
  hud.playerRecord = params.playerRecord
  hud.dailyRecord = params.dailyRecord
  hud.goalScore = Math.max(
    0,
    params.goalScore ?? hud.goalScore
  )
  hud.goalProgressPct = 0
}

export function resetHudForPlay(
  hud: GameHudState,
  params: {
    durationSec?: number
    playerRecord: number
    dailyRecord: number
    goalScore?: number
  }
): void {
  resetHudForIdle(hud, params)
}

export function syncGoalProgress(
  hud: GameHudState
): void {
  if (hud.goalScore <= 0) {
    hud.goalProgressPct = 0
    return
  }
  const raw = (hud.score / hud.goalScore) * 100
  hud.goalProgressPct = Math.max(
    0,
    Math.min(100, Math.floor(raw))
  )
}

export function createPlayableBoard(
  size: number,
  forcedTileKinds?: number
): { board: Board; tileKinds: number } {
  const tileKinds =
    typeof forcedTileKinds === 'number' &&
    Number.isInteger(forcedTileKinds) &&
    forcedTileKinds > 1
      ? forcedTileKinds
      : tileKindsForBoardSize(size)
  return {
    tileKinds,
    board: createBoard(size, size, tileKinds),
  }
}
