import type { User } from '../types/user'

/** Демо-учётка для статического деплоя (без API Практикума). */
export const GH_PAGES_DEMO_LOGIN = 'testuser12345'
export const GH_PAGES_DEMO_PASSWORD = 'Testuser12345'

/** Публичный маршрут игры на GitHub Pages (без auth guard). */
export const GH_PAGES_DEMO_GAME_PATH = '/game/demo'
export const GH_PAGES_DEMO_GAME_FINISH_PATH = '/game/demo/finish'

const SESSION_KEY = 'cosmic-match:gh-pages-demo-auth'

export const GH_PAGES_DEMO_USER: User = {
  id: 428562,
  first_name: 'Test',
  second_name: 'User',
  display_name: 'testuser12345',
  login: GH_PAGES_DEMO_LOGIN,
  email: 'testuser12345@yandex.ru',
  phone: '89990000000',
  avatar: null,
}

export function matchesGhPagesDemoCredentials(
  login: string,
  password: string
): boolean {
  return (
    login.trim() === GH_PAGES_DEMO_LOGIN && password === GH_PAGES_DEMO_PASSWORD
  )
}

export function saveGhPagesDemoSession(): void {
  sessionStorage.setItem(SESSION_KEY, '1')
}

export function clearGhPagesDemoSession(): void {
  sessionStorage.removeItem(SESSION_KEY)
}

export function isGhPagesDemoSessionActive(): boolean {
  return sessionStorage.getItem(SESSION_KEY) === '1'
}

export function readGhPagesDemoUser(): User {
  return { ...GH_PAGES_DEMO_USER }
}
