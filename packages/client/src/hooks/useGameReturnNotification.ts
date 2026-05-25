/**
 * Напоминание через Notifications API: после ухода со вкладки игры
 * (если opt-in и permission granted) показывает локальное уведомление.
 */

import { useEffect } from 'react'
import {
  GAME_RETURN_REMIND_MS,
  getNotificationPermission,
  readNotificationsOptIn,
  showGameReturnNotification,
} from '../utils/notifications'

export function useGameReturnNotification(activeOnPage: boolean): void {
  useEffect(() => {
    if (!activeOnPage) {
      return
    }
    if (!readNotificationsOptIn()) {
      return
    }
    if (getNotificationPermission() !== 'granted') {
      return
    }

    let timer: number | null = null

    const clearTimer = () => {
      if (timer !== null) {
        window.clearTimeout(timer)
        timer = null
      }
    }

    const onVisibility = () => {
      clearTimer()
      if (document.visibilityState !== 'hidden') {
        return
      }
      timer = window.setTimeout(() => {
        if (document.visibilityState === 'hidden') {
          showGameReturnNotification()
        }
      }, GAME_RETURN_REMIND_MS)
    }

    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      clearTimer()
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [activeOnPage])
}
