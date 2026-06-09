/**
 * Vibration API: короткий тактильный отклик на комбо (мобильные браузеры).
 */

export const VIBRATION_ENABLED_KEY = 'match3:vibration-enabled'

/** Паттерн для сильного комбо (мс). */
export const COMBO_VIBRATION_PATTERN = [40, 30, 60]

export function isVibrationSupported(): boolean {
  return typeof navigator !== 'undefined' && 'vibrate' in navigator
}

export function readVibrationEnabled(): boolean {
  if (typeof window === 'undefined') {
    return false
  }
  try {
    return window.localStorage.getItem(VIBRATION_ENABLED_KEY) === '1'
  } catch {
    return false
  }
}

export function writeVibrationEnabled(enabled: boolean): void {
  if (typeof window === 'undefined') {
    return
  }
  try {
    window.localStorage.setItem(VIBRATION_ENABLED_KEY, enabled ? '1' : '0')
  } catch {
    // noop
  }
}

export function vibrateComboFeedback(): void {
  if (!readVibrationEnabled() || !isVibrationSupported()) {
    return
  }
  try {
    navigator.vibrate(COMBO_VIBRATION_PATTERN)
  } catch {
    // noop
  }
}

export function vibrateWinFeedback(): void {
  if (!readVibrationEnabled() || !isVibrationSupported()) {
    return
  }
  try {
    navigator.vibrate([80, 50, 80, 50, 120])
  } catch {
    // noop
  }
}
