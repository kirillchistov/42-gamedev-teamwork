/**
 * Ставит match-3 на паузу при скрытии вкладки (Page Visibility API).
 */

import { useEffect, useState } from 'react'
import { subscribePageVisibility } from '../utils/pageVisibility'

type UiPhase = 'countdown' | 'ready' | 'playing' | 'results'

type Options = {
  uiPhase: UiPhase
  isPauseOpen: boolean
  setIsPauseOpen: (open: boolean) => void
  pauseOnTabHidden: boolean
}

export function usePageVisibilityPause({
  uiPhase,
  isPauseOpen,
  setIsPauseOpen,
  pauseOnTabHidden,
}: Options): boolean {
  const [pausedByVisibility, setPausedByVisibility] = useState(false)

  useEffect(() => {
    if (!pauseOnTabHidden) {
      setPausedByVisibility(false)
      return
    }

    return subscribePageVisibility(hidden => {
      if (uiPhase !== 'playing') {
        setPausedByVisibility(false)
        return
      }
      if (hidden) {
        setIsPauseOpen(true)
        setPausedByVisibility(true)
        return
      }
      setPausedByVisibility(false)
    })
  }, [uiPhase, setIsPauseOpen, pauseOnTabHidden])

  useEffect(() => {
    if (uiPhase !== 'playing' && pausedByVisibility) {
      setPausedByVisibility(false)
    }
  }, [uiPhase, pausedByVisibility])

  useEffect(() => {
    if (!pausedByVisibility && isPauseOpen) {
      return
    }
    if (!isPauseOpen && pausedByVisibility) {
      setPausedByVisibility(false)
    }
  }, [isPauseOpen, pausedByVisibility])

  return pausedByVisibility
}
