import { useEffect, useRef } from 'react'
import { useSelector } from '../store'
import { useLandingTheme } from '../contexts/LandingThemeContext'
import { themeGet } from '../shared/api/themeApi'
import {
  hasStoredLandingTheme,
  isLandingTheme,
  readStoredLandingTheme,
} from '../shared/landingTheme'
import { pushLocalThemeToServer } from '../utils/themeSync'
import { selectUserIsAuthChecked } from '../slices/userSlice'
import { isStaticGhPagesDeploy } from '../shared/staticDeploy'

// Синк темы с packages/server после проверки сессии ЯП.
export function useThemeServerSync(): void {
  const isAuthChecked = useSelector(
    selectUserIsAuthChecked
  )
  const { setTheme } = useLandingTheme()
  const sessionSyncedRef = useRef(false)

  useEffect(() => {
    if (isStaticGhPagesDeploy()) {
      return
    }
    if (
      !isAuthChecked ||
      sessionSyncedRef.current
    ) {
      return
    }
    sessionSyncedRef.current = true

    void (async () => {
      if (!hasStoredLandingTheme()) {
        try {
          const { theme: serverTheme } =
            await themeGet()
          if (isLandingTheme(serverTheme)) {
            setTheme(serverTheme)
          }
        } catch {
          /* если нет cookie или упала сеть — оставляем локальный выбор */
        }
      }

      try {
        await pushLocalThemeToServer(
          readStoredLandingTheme()
        )
      } catch {
        /* не блокируем UI, запись в лог */
      }
    })()
  }, [isAuthChecked, setTheme])
}
