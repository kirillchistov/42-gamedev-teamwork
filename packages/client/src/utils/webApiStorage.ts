/**
 * Ключи localStorage для настроек Web API (спринт 9.3).
 */

export const PAUSE_ON_TAB_HIDDEN_KEY = 'match3:pause-on-tab-hidden'

export function readPauseOnTabHidden(): boolean {
  if (typeof window === 'undefined') {
    return true
  }
  try {
    const raw = window.localStorage.getItem(PAUSE_ON_TAB_HIDDEN_KEY)
    if (raw === null) {
      return true
    }
    return raw === '1'
  } catch {
    return true
  }
}

export function writePauseOnTabHidden(enabled: boolean): void {
  if (typeof window === 'undefined') {
    return
  }
  try {
    window.localStorage.setItem(PAUSE_ON_TAB_HIDDEN_KEY, enabled ? '1' : '0')
  } catch {
    // noop
  }
}
