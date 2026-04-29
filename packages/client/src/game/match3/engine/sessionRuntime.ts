/**
 * sessionRuntime — таймер партии и idle-hint без привязки к React.
 * Состояние фазы/HUD остаётся в bootstrap; сюда передаются геттеры/колбэки.
 */
import type { Phase } from './gameState'
import type { MoveCandidate } from './core/possibleMoves'

export type RoundTimerApi = {
  start: () => void
  stop: () => void
}

export function createRoundTimer(deps: {
  getPhase: () => Phase
  getInputBlocked: () => boolean
  /** Если true — секунды времени не списываются (например, открыта карточка иероглифа). */
  getTimerPaused?: () => boolean
  getTimeLeftSec: () => number
  setTimeLeftSec: (next: number) => void
  emitHud: () => void
  onTimeUp: () => void
  intervalMs?: number
}): RoundTimerApi {
  let timerId: number | null = null
  const stop = () => {
    if (timerId !== null) {
      window.clearInterval(timerId)
      timerId = null
    }
  }
  const start = () => {
    stop()
    timerId = window.setInterval(() => {
      if (deps.getPhase() !== 'playing') return
      if (deps.getInputBlocked()) return
      if (deps.getTimerPaused?.()) return
      const t = deps.getTimeLeftSec()
      if (t <= 0) return
      deps.setTimeLeftSec(t - 1)
      deps.emitHud()
      if (deps.getTimeLeftSec() === 0) {
        deps.onTimeUp()
      }
    }, deps.intervalMs ?? 1000)
  }
  return { start, stop }
}

export type IdleHintApi = {
  clearHint: () => void
  stopTimer: () => void
  schedule: () => void
  markActivity: () => void
}

export function createIdleHintController(deps: {
  getPhase: () => Phase
  getInputBlocked: () => boolean
  getIsResolving: () => boolean
  getHintIdleMs: () => number
  selectionBlocksHint: () => boolean
  getCurrentHintMove: () => MoveCandidate | null
  setHintMove: (
    move: MoveCandidate | null
  ) => void
  getFirstMoveCandidate: () =>
    | MoveCandidate
    | undefined
  redraw: () => void
}): IdleHintApi {
  let hintTimeoutId: number | null = null

  const stopTimer = () => {
    if (hintTimeoutId !== null) {
      window.clearTimeout(hintTimeoutId)
      hintTimeoutId = null
    }
  }

  const clearHint = () => {
    deps.setHintMove(null)
  }

  const showHintIfIdle = () => {
    if (
      deps.getPhase() !== 'playing' ||
      deps.getIsResolving() ||
      deps.getInputBlocked()
    )
      return
    if (deps.selectionBlocksHint()) return
    const candidate = deps.getFirstMoveCandidate()
    if (!candidate) return
    deps.setHintMove(candidate)
    deps.redraw()
  }

  const schedule = () => {
    stopTimer()
    if (
      deps.getPhase() !== 'playing' ||
      deps.getInputBlocked()
    )
      return
    hintTimeoutId = window.setTimeout(() => {
      showHintIfIdle()
    }, deps.getHintIdleMs())
  }

  const markActivity = () => {
    const hadHint =
      deps.getCurrentHintMove() != null
    clearHint()
    if (deps.getPhase() === 'playing') {
      if (hadHint) deps.redraw()
      schedule()
    }
  }

  return {
    clearHint,
    stopTimer,
    schedule,
    markActivity,
  }
}
