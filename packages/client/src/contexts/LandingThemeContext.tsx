/**
 * Тема лендинга (light-flat, light-3d, dark-neon): localStorage + класс на body;
 * синхронизация с packages/server — scheduleThemePut / useThemeServerSync.
 * 6.3.2 /game: toggleColorMode — dark-neon ↔ последняя светлая тема.
 */
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
} from 'react'
import {
  LANDING_THEME_CLASS,
  persistLandingTheme,
  readLastLightLandingTheme,
  readStoredLandingTheme,
  type LandingTheme,
} from '../shared/landingTheme'
import { scheduleThemePut } from '../utils/themeSync'

export type { LandingTheme } from '../shared/landingTheme'

export { LANDING_THEME_CLASS } from '../shared/landingTheme'

type LandingThemeContextValue = {
  theme: LandingTheme
  setTheme: (t: LandingTheme) => void
  /** Светлая ↔ тёмная (возврат на последнюю светлую flat/3d). */
  toggleColorMode: () => void
}

const LandingThemeContext =
  createContext<LandingThemeContextValue | null>(
    null
  )

export const LandingThemeProvider: React.FC<{
  children: React.ReactNode
}> = ({ children }) => {
  const useIsomorphicLayoutEffect =
    typeof window !== 'undefined'
      ? useLayoutEffect
      : useEffect

  const [theme, setThemeState] =
    useState<LandingTheme>('light-flat')

  useIsomorphicLayoutEffect(() => {
    setThemeState(readStoredLandingTheme())
  }, [])

  useIsomorphicLayoutEffect(() => {
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
      persistLandingTheme(t)
      scheduleThemePut(t)
    },
    []
  )

  const toggleColorMode = useCallback(() => {
    setThemeState(prev => {
      const next =
        prev === 'dark-neon'
          ? readLastLightLandingTheme()
          : 'dark-neon'
      persistLandingTheme(next)
      scheduleThemePut(next)
      return next
    })
  }, [])

  const value = useMemo(
    () => ({
      theme,
      setTheme,
      toggleColorMode,
    }),
    [theme, setTheme, toggleColorMode]
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
