/**
 * Публичные маршруты без ProtectedRoute: лендинг, логин, регистрацию и страницы ошибок
 * Иигру, форум, лидеров и профиль только после входа).
 */
export const PUBLIC_ROUTE_PATHS: readonly string[] =
  [
    '/',
    // '/game',
    '/login',
    '/sign-in',
    '/signin',
    // '/logout',
    '/signup',
    '/register',
    // '/leaderboard',
    // '/forum',
    // '/forum-topic',
    // '/forum/:topicId',
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
