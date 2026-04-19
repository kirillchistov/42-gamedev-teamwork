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
  const base = (
    import.meta.env.BASE_URL || '/'
  ).replace(/\/+$/, '')
  if (!base) return `/${path}`
  return `${base}/${path}`
}
