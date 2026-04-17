/**
 * Тема лендинга (light-flat, light-3d, dark-neon): хранение в localStorage, класс на body.
 * 6.3.2 Оболочка /game:
 * Одна кнопка «луна/солнце» на /game переключает dark-neon ↔ последняя светлая тема.
 * Реализовал: LAST_LIGHT_THEME_KEY, readLastLightTheme, запись при setTheme(light-*),
 * toggleColorMode в контексте; инициализация last-light при первом чтении темы.
 * Потребитель: Header variant=game. Остальные страницы по-прежнему вызывают setTheme напрямую.
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

export type LandingTheme =
  | 'light-flat'
  | 'light-3d'
  | 'dark-neon'

const STORAGE_KEY =
  'cosmic-match.landing-theme.v1'

const LAST_LIGHT_THEME_KEY =
  'cosmic-match.last-light-theme.v1'

function readLastLightTheme():
  | 'light-flat'
  | 'light-3d' {
  try {
    const v = localStorage.getItem(
      LAST_LIGHT_THEME_KEY
    )
    if (v === 'light-flat' || v === 'light-3d')
      return v
  } catch {
    console.log(
      '[Private: readLastLightTheme]: ошибка'
    )
  }
  return 'light-flat'
}

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
    console.log(
      '[Private: readStoredTheme]: ошибка'
    )
  }
  return 'light-flat'
}

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
  // Avoid SSR warning: useLayoutEffect should run only in browser.
  const useIsomorphicLayoutEffect =
    typeof window !== 'undefined'
      ? useLayoutEffect
      : useEffect

  const [theme, setThemeState] =
    useState<LandingTheme>('light-flat')

  useIsomorphicLayoutEffect(() => {
    const t = readStoredTheme()
    setThemeState(t)
    if (t === 'light-flat' || t === 'light-3d') {
      try {
        localStorage.setItem(
          LAST_LIGHT_THEME_KEY,
          t
        )
      } catch {
        console.log(
          '[Private: useLayoutEffect]: ошибка'
        )
      }
    }
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
      try {
        localStorage.setItem(STORAGE_KEY, t)
        if (
          t === 'light-flat' ||
          t === 'light-3d'
        ) {
          localStorage.setItem(
            LAST_LIGHT_THEME_KEY,
            t
          )
        }
      } catch {
        console.log('[Private: setTheme]: ошибка')
      }
    },
    []
  )

  const toggleColorMode = useCallback(() => {
    setThemeState(prev => {
      const next =
        prev === 'dark-neon'
          ? readLastLightTheme()
          : 'dark-neon'
      try {
        localStorage.setItem(STORAGE_KEY, next)
        if (
          next === 'light-flat' ||
          next === 'light-3d'
        ) {
          localStorage.setItem(
            LAST_LIGHT_THEME_KEY,
            next
          )
        }
      } catch {
        console.log(
          '[Private: toggleColorMode]: ошибка'
        )
      }
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
