/**
 * GitHub Pages vs SSR/Docker. Без import.meta — Jest/ts-jest в CJS не поддерживают meta.
 * В браузерном бандле Vite подставляет process.env.VITE_STATIC_DEPLOY через define.
 */

function isBrowserBundle(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof document !== 'undefined'
  )
}

export function isStaticGhPagesDeploy(): boolean {
  if (!isBrowserBundle()) {
    return false
  }
  return (
    process.env.VITE_STATIC_DEPLOY === 'gh-pages'
  )
}
