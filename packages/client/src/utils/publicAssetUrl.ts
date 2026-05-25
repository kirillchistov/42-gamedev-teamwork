/**
 * Публичные файлы из `public/` (иконки, фоны арены).
 * На GitHub Pages base = `/repo-name/` (Vite `base` + `__APP_BASE_URL__`).
 */

declare const __APP_BASE_URL__: string | undefined

function normalizeAppBase(raw: string): string {
  return raw.replace(/\/+$/, '')
}

function readAppBase(): string {
  if (typeof __APP_BASE_URL__ !== 'undefined') {
    return normalizeAppBase(__APP_BASE_URL__)
  }
  const fromGlobal = (
    globalThis as {
      __APP_BASE_URL__?: string
    }
  ).__APP_BASE_URL__
  if (fromGlobal != null && String(fromGlobal).trim() !== '') {
    return normalizeAppBase(String(fromGlobal))
  }
  return ''
}

export function publicAssetUrl(pathFromPublicRoot: string): string {
  const raw = pathFromPublicRoot.trim()
  const path = raw.startsWith('/') ? raw.slice(1) : raw
  const base = readAppBase()
  if (!base) return `/${path}`
  return `${base}/${path}`
}
