/**
 * Публичные файлы из `public/` (иконки, фоны арены).
 * На GitHub Pages `import.meta.env.BASE_URL` = `/repo-name/`, иначе пути с корня `/icons/...` дают 404.
 */
export function publicAssetUrl(
  pathFromPublicRoot: string
): string {
  const raw = pathFromPublicRoot.trim()
  const path = raw.startsWith('/')
    ? raw.slice(1)
    : raw
  const appBase =
    (
      globalThis as {
        __APP_BASE_URL__?: string
      }
    ).__APP_BASE_URL__ || '/'
  const base = appBase.replace(/\/+$/, '')
  if (!base) return `/${path}`
  return `${base}/${path}`
}
