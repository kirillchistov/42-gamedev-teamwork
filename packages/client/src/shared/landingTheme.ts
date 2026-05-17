/** Темы лендинга — синк с бэкендом landingThemes.ts */
export type LandingTheme =
  | 'light-flat'
  | 'light-3d'
  | 'dark-neon'

export const LANDING_THEMES: readonly LandingTheme[] =
  ['light-flat', 'light-3d', 'dark-neon']

export const DEFAULT_LANDING_THEME: LandingTheme =
  'light-flat'

export const LANDING_THEME_STORAGE_KEY =
  'cosmic-match.landing-theme.v1'

export const LAST_LIGHT_THEME_STORAGE_KEY =
  'cosmic-match.last-light-theme.v1'

export const LANDING_THEME_CLASS: Record<
  LandingTheme,
  string
> = {
  'light-flat': 'landing--light-flat',
  'light-3d': 'landing--light-3d',
  'dark-neon': 'landing--dark-neon',
}

export function isLandingTheme(
  value: unknown
): value is LandingTheme {
  return (
    typeof value === 'string' &&
    (
      LANDING_THEMES as readonly string[]
    ).includes(value)
  )
}

export function readStoredLandingTheme(): LandingTheme {
  try {
    const v = localStorage.getItem(
      LANDING_THEME_STORAGE_KEY
    )
    if (isLandingTheme(v)) return v
  } catch {
    /* ignore */
  }
  return DEFAULT_LANDING_THEME
}

export function hasStoredLandingTheme(): boolean {
  try {
    return (
      localStorage.getItem(
        LANDING_THEME_STORAGE_KEY
      ) != null
    )
  } catch {
    return false
  }
}

export function readLastLightLandingTheme():
  | 'light-flat'
  | 'light-3d' {
  try {
    const v = localStorage.getItem(
      LAST_LIGHT_THEME_STORAGE_KEY
    )
    if (v === 'light-flat' || v === 'light-3d') {
      return v
    }
  } catch {
    /* ignore */
  }
  return 'light-flat'
}

export function persistLandingTheme(
  theme: LandingTheme
): void {
  try {
    localStorage.setItem(
      LANDING_THEME_STORAGE_KEY,
      theme
    )
    if (
      theme === 'light-flat' ||
      theme === 'light-3d'
    ) {
      localStorage.setItem(
        LAST_LIGHT_THEME_STORAGE_KEY,
        theme
      )
    }
  } catch {
    /* ignore */
  }
}
