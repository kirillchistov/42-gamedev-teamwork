import { themePut } from '../shared/api/themeApi'
import type { LandingTheme } from '../shared/landingTheme'

const DEBOUNCE_MS = 400

let debounceTimer: ReturnType<
  typeof setTimeout
> | null = null

// Отложенная оптимистичная отправка на сервер
export function scheduleThemePut(
  theme: LandingTheme
): void {
  if (typeof window === 'undefined') return
  if (debounceTimer != null) {
    clearTimeout(debounceTimer)
  }
  debounceTimer = setTimeout(() => {
    debounceTimer = null
    void themePut(theme).catch(() => {
      /* локальный выбор сохраняем */
    })
  }, DEBOUNCE_MS)
}

/** По готовности - локальный выбор перетирает серверное значение. */
export async function pushLocalThemeToServer(
  theme: LandingTheme
): Promise<void> {
  if (typeof window === 'undefined') return
  if (debounceTimer != null) {
    clearTimeout(debounceTimer)
    debounceTimer = null
  }
  await themePut(theme)
}
