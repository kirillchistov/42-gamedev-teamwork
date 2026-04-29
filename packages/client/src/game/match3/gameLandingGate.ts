const GAME_LANDING_SEEN_KEY =
  'match3:landing-seen-after-auth'

export function markGameLandingNeedsShow(): void {
  if (typeof window === 'undefined') return
  try {
    window.sessionStorage.setItem(
      GAME_LANDING_SEEN_KEY,
      '0'
    )
  } catch {
    // noop
  }
}

export function markGameLandingSeen(): void {
  if (typeof window === 'undefined') return
  try {
    window.sessionStorage.setItem(
      GAME_LANDING_SEEN_KEY,
      '1'
    )
  } catch {
    // noop
  }
}

export function hasSeenGameLanding(): boolean {
  if (typeof window === 'undefined') return true
  try {
    return (
      window.sessionStorage.getItem(
        GAME_LANDING_SEEN_KEY
      ) === '1'
    )
  } catch {
    return true
  }
}

export function resolveGameEntryPath():
  | '/game'
  | '/game/start' {
  return hasSeenGameLanding()
    ? '/game/start'
    : '/game'
}
