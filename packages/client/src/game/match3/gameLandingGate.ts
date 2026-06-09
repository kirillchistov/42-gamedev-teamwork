import { GH_PAGES_DEMO_GAME_PATH } from '../../shared/ghPagesDemoAuth'
import { isStaticGhPagesDeploy } from '../../shared/staticDeploy'

const GAME_LANDING_SEEN_KEY = 'match3:landing-seen-after-auth'

export type GameEntryPath = '/game' | '/game/start' | '/game/demo'

export function markGameLandingNeedsShow(): void {
  if (typeof window === 'undefined') return
  try {
    window.sessionStorage.setItem(GAME_LANDING_SEEN_KEY, '0')
  } catch {
    // noop
  }
}

export function markGameLandingSeen(): void {
  if (typeof window === 'undefined') return
  try {
    window.sessionStorage.setItem(GAME_LANDING_SEEN_KEY, '1')
  } catch {
    // noop
  }
}

export function hasSeenGameLanding(): boolean {
  if (typeof window === 'undefined') return true
  try {
    return window.sessionStorage.getItem(GAME_LANDING_SEEN_KEY) === '1'
  } catch {
    return true
  }
}

export function resolveGameEntryPath(): GameEntryPath {
  if (isStaticGhPagesDeploy()) {
    return GH_PAGES_DEMO_GAME_PATH
  }
  return hasSeenGameLanding() ? '/game/start' : '/game'
}

/** Маршрут игры после редиректа с /login (GH Pages → публичный demo). */
export function resolveGameReturnPath(path: string): string {
  if (!isStaticGhPagesDeploy()) {
    return path
  }
  if (
    path === GH_PAGES_DEMO_GAME_PATH ||
    path.startsWith(`${GH_PAGES_DEMO_GAME_PATH}/`)
  ) {
    return path
  }
  if (path === '/game' || path.startsWith('/game/')) {
    return GH_PAGES_DEMO_GAME_PATH
  }
  return path
}
