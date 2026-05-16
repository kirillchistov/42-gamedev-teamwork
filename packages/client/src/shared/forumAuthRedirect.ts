/** Не сбрасывать сессию Практикума на /login после 403 форума (см. initLoginPage). */
export const FORUM_AUTH_REDIRECT_FLAG =
  'cosmic-match.forum-auth-redirect.v1'

export function markForumAuthRedirect(): void {
  if (typeof sessionStorage === 'undefined') {
    return
  }
  sessionStorage.setItem(
    FORUM_AUTH_REDIRECT_FLAG,
    '1'
  )
}

export function consumeForumAuthRedirect(): boolean {
  if (typeof sessionStorage === 'undefined') {
    return false
  }
  const had =
    sessionStorage.getItem(
      FORUM_AUTH_REDIRECT_FLAG
    ) === '1'
  sessionStorage.removeItem(
    FORUM_AUTH_REDIRECT_FLAG
  )
  return had
}
