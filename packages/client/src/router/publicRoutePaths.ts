/**
 * Публичные маршруты без ProtectedRoute.
 * Профиль, друзья и шаблонные страницы — только после входа.
 */
export const PUBLIC_ROUTE_PATHS: readonly string[] =
  [
    '/',
    '/login',
    '/sign-in',
    '/signin',
    '/logout',
    '/signup',
    '/register',
    '/error404',
    '/error/404',
    '/error500',
    '/error/500',
    '*',
  ]

export const publicRoutePathSet = new Set(
  PUBLIC_ROUTE_PATHS
)

export function isPublicRoutePath(
  path: string | undefined
): boolean {
  if (path === undefined) return false
  return publicRoutePathSet.has(path)
}
