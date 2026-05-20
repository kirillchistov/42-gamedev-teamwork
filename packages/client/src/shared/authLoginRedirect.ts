/** Не сбрасывать сессию на /login после редиректа с защищённого маршрута (см. initLoginPage). */
export const AUTH_LOGIN_REDIRECT_FLAG =
  'cosmic-match.auth-login-redirect.v1'

export function markAuthLoginRedirect(
  returnPath: string
): void {
  if (typeof sessionStorage === 'undefined') {
    return
  }
  sessionStorage.setItem(
    AUTH_LOGIN_REDIRECT_FLAG,
    returnPath
  )
}

export function peekAuthLoginRedirect():
  | string
  | null {
  if (typeof sessionStorage === 'undefined') {
    return null
  }
  const path = sessionStorage.getItem(
    AUTH_LOGIN_REDIRECT_FLAG
  )
  return path && path.startsWith('/')
    ? path
    : null
}

export function consumeAuthLoginRedirect():
  | string
  | null {
  if (typeof sessionStorage === 'undefined') {
    return null
  }
  const path = sessionStorage.getItem(
    AUTH_LOGIN_REDIRECT_FLAG
  )
  sessionStorage.removeItem(
    AUTH_LOGIN_REDIRECT_FLAG
  )
  return path && path.startsWith('/')
    ? path
    : null
}
