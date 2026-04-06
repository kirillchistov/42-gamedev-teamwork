/**
 * 6.1.1 Улучшить ядро игры: отделить логику от визуала
 * gameState - модуль состояния игры: здесь типы и чистые правила состояния:
 * GameHudState, Phase, ScoreMode, createInitialHud, resetHudForIdle / resetHudForPlay,
 * tileKindsForBoardSize, scoreMultiplier, createPlayableBoard
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
  maxCombo: number
  playerRecord: number
  dailyRecord: number
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
    maxCombo: 0,
    playerRecord: 0,
    dailyRecord: 0,
    timeLeftSec: durationSec,
  }
}

export function resetHudForIdle(
  hud: GameHudState,
  params: {
    durationSec?: number
    playerRecord: number
    dailyRecord: number
  }
): void {
  const durationSec =
    params.durationSec ?? GAME_DURATION_SEC
  hud.score = 0
  hud.moves = 0
  hud.maxCombo = 0
  hud.timeLeftSec = durationSec
  hud.playerRecord = params.playerRecord
  hud.dailyRecord = params.dailyRecord
}

export function resetHudForPlay(
  hud: GameHudState,
  params: {
    durationSec?: number
    playerRecord: number
    dailyRecord: number
  }
): void {
  resetHudForIdle(hud, params)
}

export function createPlayableBoard(
  size: number
): { board: Board; tileKinds: number } {
  const tileKinds = tileKindsForBoardSize(size)
  return {
    tileKinds,
    board: createBoard(size, size, tileKinds),
  }
}
