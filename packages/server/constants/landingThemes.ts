/** Список тем лендинга — синк с клиентом (`shared/landingTheme.ts`). */
export const LANDING_THEMES = [
  'light-flat',
  'light-3d',
  'dark-neon',
] as const

export type LandingThemeId =
  typeof LANDING_THEMES[number]

export const DEFAULT_LANDING_THEME: LandingThemeId =
  'light-flat'

export const ANONYMOUS_SESSION_COOKIE =
  'anonymous_session_id'

/** Срок жизни гостевой сессии 3 суток */
export const GUEST_SESSION_TTL_HOURS = 72

export function isLandingThemeId(
  value: unknown
): value is LandingThemeId {
  return (
    typeof value === 'string' &&
    (
      LANDING_THEMES as readonly string[]
    ).includes(value)
  )
}
