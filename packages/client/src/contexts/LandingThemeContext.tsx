import React, {
  createContext,
  useCallback,
  useContext,
  useLayoutEffect,
  useMemo,
  useState,
} from 'react'

export type LandingTheme =
  | 'light-flat'
  | 'light-3d'
  | 'dark-neon'

const STORAGE_KEY =
  'cosmic-match.landing-theme.v1'

export const LANDING_THEME_CLASS: Record<
  LandingTheme,
  string
> = {
  'light-flat': 'landing--light-flat',
  'light-3d': 'landing--light-3d',
  'dark-neon': 'landing--dark-neon',
}

function readStoredTheme(): LandingTheme {
  try {
    const v = localStorage.getItem(STORAGE_KEY)
    if (
      v === 'light-flat' ||
      v === 'light-3d' ||
      v === 'dark-neon'
    )
      return v
  } catch {
    /* private mode */
  }
  return 'light-flat'
}

type LandingThemeContextValue = {
  theme: LandingTheme
  setTheme: (t: LandingTheme) => void
}

const LandingThemeContext =
  createContext<LandingThemeContextValue | null>(
    null
  )

export const LandingThemeProvider: React.FC<{
  children: React.ReactNode
}> = ({ children }) => {
  const [theme, setThemeState] =
    useState<LandingTheme>('light-flat')

  useLayoutEffect(() => {
    setThemeState(readStoredTheme())
  }, [])

  useLayoutEffect(() => {
    if (typeof document === 'undefined') return
    document.body.classList.remove(
      'landing--light-flat',
      'landing--light-3d',
      'landing--dark-neon'
    )
    document.body.classList.add(
      LANDING_THEME_CLASS[theme]
    )
  }, [theme])

  const setTheme = useCallback(
    (t: LandingTheme) => {
      setThemeState(t)
      try {
        localStorage.setItem(STORAGE_KEY, t)
      } catch {
        /* ignore */
      }
    },
    []
  )

  const value = useMemo(
    () => ({ theme, setTheme }),
    [theme, setTheme]
  )

  return (
    <LandingThemeContext.Provider value={value}>
      {children}
    </LandingThemeContext.Provider>
  )
}

export function useLandingTheme(): LandingThemeContextValue {
  const ctx = useContext(LandingThemeContext)
  if (!ctx) {
    throw new Error(
      'useLandingTheme must be used within LandingThemeProvider'
    )
  }
  return ctx
}
