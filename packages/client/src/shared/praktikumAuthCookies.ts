/** Cookie сессии Практикума. anonymous_session_id (Path=/) не отправляем на /api/v2. */
export const PRAKTIKUM_AUTH_COOKIE_NAMES = new Set(['uuid', 'authCookie'])

export function filterPraktikumCookieHeader(
  cookieHeader: string | undefined
): string | undefined {
  if (!cookieHeader) {
    return undefined
  }
  const kept = cookieHeader
    .split(';')
    .map(part => part.trim())
    .filter(Boolean)
    .filter(part => {
      const name = part.split('=')[0]?.trim()
      return name != null && PRAKTIKUM_AUTH_COOKIE_NAMES.has(name)
    })
  return kept.length > 0 ? kept.join('; ') : undefined
}
