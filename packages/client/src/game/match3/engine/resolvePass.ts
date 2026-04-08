/**
 * Один проход каскада: матч → очистка/очки → лёд/цели → падение.
 * Оркестрация цикла и «тупик» остаются в bootstrap.
 */
import type { Board } from './core/grid'
import type { CellRC } from './core/match'
import { findMatches } from './core/match'
import { collapse } from './core/collapse'
import { refill } from './core/refill'
import { clearAndScore } from './core/scoring'
import {
  classifySwapCelebration,
  collectClearedCells,
  collectSpecialActivations,
} from './resolvePipeline'
import {
  applyGoalDamageFromBombs,
  applyIceDamage,
  countPositiveCells,
  type OverlayGrid,
} from './obstacleSystem'
import type { GameHudState } from './gameState'
import { syncGoalProgress } from './gameState'
import {
  match3AnimMs,
  type GameThemeOption,
  type GameVfxQualityOption,
} from './config'
import type { MatchFxApi } from './matchFx'

export const RESOLVE_FALL_ANIM_MS =
  match3AnimMs(190)

export type ResolveTileMotion = {
  from: CellRC
  to: CellRC
}

const COMBO_SHAKE_MIN_CHAIN = 3

export type Match3ResolvePassEnv = {
  board: Board
  getMatchBoard: () => Board
  isFrozenCell: (r: number, c: number) => boolean
  getIceGrid: () => OverlayGrid
  setIceGrid: (g: OverlayGrid) => void
  getGoalGrid: () => OverlayGrid
  setGoalGrid: (g: OverlayGrid) => void
  hud: GameHudState
  tileKinds: number
  chain: number
  gameVfxQuality: GameVfxQualityOption
  gameTheme: GameThemeOption
  scoreMult: () => number
  iceScorePerDamage: number
  iceBreakBonus: number
  targetScorePerHit: number
  onPremiumMatchBorder?: (
    shape: 'line4plus' | 'tOrL'
  ) => void
  onComboShake?: (chain: number) => void
  playSound: (fx: 'match' | 'cascade') => void
  matchFx: MatchFxApi | null
  ensureFxLoop: () => void
  cloneBoard: (b: Board) => Board
  buildFallMotions: (
    before: Board,
    after: Board
  ) => ResolveTileMotion[]
  animateTileMotions: (
    motions: ResolveTileMotion[],
    durationMs: number,
    opts?: { overshoot?: boolean }
  ) => Promise<void>
  flashMatches: (
    matches: CellRC[],
    opts?: { durationMs?: number; chain?: number }
  ) => Promise<void>
  clearHint: () => void
  emitHud: () => void
  delay: (ms: number) => Promise<void>
}

export async function runOneResolvePass(
  env: Match3ResolvePassEnv
): Promise<{
  matched: boolean
  nextChain: number
}> {
  const matches = findMatches(env.getMatchBoard())
  if (matches.length === 0) {
    return {
      matched: false,
      nextChain: env.chain,
    }
  }

  const boardBeforeClear = env.cloneBoard(
    env.board
  )
  const specialActivations =
    collectSpecialActivations(
      boardBeforeClear,
      matches
    )

  const matchClusterStyle =
    classifySwapCelebration(matches)
  if (
    env.gameVfxQuality === 'full' &&
    (matchClusterStyle === 'line4plus' ||
      matchClusterStyle === 'tOrL')
  ) {
    env.onPremiumMatchBorder?.(matchClusterStyle)
  }

  await env.flashMatches(matches, {
    durationMs: 220,
    chain: env.chain,
  })

  const rows = env.board.length
  const cols =
    rows > 0 ? env.board[0]?.length ?? 0 : 0
  const clearedCells = collectClearedCells(
    rows,
    cols,
    matches,
    specialActivations
  )

  const base = clearAndScore(env.board, matches, {
    isCellClearable: (r, c) =>
      !env.isFrozenCell(r, c),
  })

  const iceDamage = applyIceDamage({
    iceGrid: env.getIceGrid(),
    cleared: clearedCells,
    chain: env.chain,
    scoreMult: env.scoreMult(),
    scorePerDamage: env.iceScorePerDamage,
    breakBonus: env.iceBreakBonus,
  })
  env.setIceGrid(iceDamage.nextIceGrid)

  const goalDamage = applyGoalDamageFromBombs({
    goalGrid: env.getGoalGrid(),
    activations: specialActivations,
    chain: env.chain,
    scoreMult: env.scoreMult(),
    scorePerHit: env.targetScorePerHit,
  })
  env.setGoalGrid(goalDamage.nextGoalGrid)

  env.hud.goalTargetsLeft = countPositiveCells(
    env.getGoalGrid()
  )
  syncGoalProgress(env.hud)

  const gained = Math.floor(
    base * env.chain * env.scoreMult()
  )
  env.hud.score +=
    gained + iceDamage.score + goalDamage.score
  env.hud.currentCombo = env.chain
  syncGoalProgress(env.hud)
  env.emitHud()

  if (
    env.chain >= COMBO_SHAKE_MIN_CHAIN &&
    env.gameVfxQuality === 'full'
  ) {
    env.onComboShake?.(env.chain)
  }
  env.playSound(
    env.chain > 1 ? 'cascade' : 'match'
  )

  if (
    env.matchFx &&
    env.gameVfxQuality === 'full'
  ) {
    env.matchFx.burstSpecialActivations(
      boardBeforeClear,
      specialActivations,
      env.gameTheme
    )
    if (goalDamage.hits.length > 0) {
      env.matchFx.burstGoalHits(
        env.board,
        goalDamage.hits,
        env.gameTheme
      )
    }
    env.matchFx.burstScoreText(
      env.board,
      matches,
      gained + iceDamage.score + goalDamage.score,
      env.chain
    )
    env.ensureFxLoop()
  }

  const beforeFall = env.cloneBoard(env.board)
  collapse(env.board)
  refill(env.board, env.tileKinds)
  const fallMotions = env.buildFallMotions(
    beforeFall,
    env.board
  )
  env.clearHint()
  await env.animateTileMotions(
    fallMotions,
    RESOLVE_FALL_ANIM_MS,
    { overshoot: true }
  )

  await env.delay(match3AnimMs(24))
  return {
    matched: true,
    nextChain: env.chain + 1,
  }
}
