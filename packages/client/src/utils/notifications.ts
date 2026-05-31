/**
 * Обёртка над Notifications API: запрос разрешения, opt-in в localStorage,
 * показ локального напоминания «вернуться в игру» (без сервера).
 */

export const NOTIFICATIONS_OPT_IN_KEY = 'match3:notifications-opt-in'

/** Задержка напоминания после ухода со вкладки (мс). Для демо можно уменьшить до 30_000. */
export const GAME_RETURN_REMIND_MS = 120_000

export type NotificationPermissionState = 'unsupported' | NotificationPermission

export function isNotificationSupported(): boolean {
  return typeof window !== 'undefined' && typeof Notification !== 'undefined'
}

export function getNotificationPermission(): NotificationPermissionState {
  if (!isNotificationSupported()) {
    return 'unsupported'
  }
  return Notification.permission
}

export function readNotificationsOptIn(): boolean {
  if (typeof window === 'undefined') {
    return false
  }
  try {
    return window.localStorage.getItem(NOTIFICATIONS_OPT_IN_KEY) === '1'
  } catch {
    return false
  }
}

export function writeNotificationsOptIn(enabled: boolean): void {
  if (typeof window === 'undefined') {
    return
  }
  try {
    window.localStorage.setItem(NOTIFICATIONS_OPT_IN_KEY, enabled ? '1' : '0')
  } catch {
    // noop
  }
}

export async function requestNotificationPermission(): Promise<NotificationPermissionState> {
  if (!isNotificationSupported()) {
    return 'unsupported'
  }
  if (Notification.permission === 'granted') {
    return 'granted'
  }
  if (Notification.permission === 'denied') {
    return 'denied'
  }
  try {
    const requestPermission = (
      window.Notification as typeof Notification & {
        requestPermission: () => Promise<NotificationPermission>
      }
    ).requestPermission
    const result = await requestPermission.call(window.Notification)
    return result
  } catch {
    return 'denied'
  }
}

export function showGameReturnNotification(): boolean {
  if (!isNotificationSupported()) {
    return false
  }
  if (Notification.permission !== 'granted') {
    return false
  }
  try {
    new Notification('Cosmic Match', {
      body: 'Партия ждёт — вернитесь в игру, когда будет удобно.',
      tag: 'cosmic-match-return',
      requireInteraction: false,
    })
    return true
  } catch {
    return false
  }
}
