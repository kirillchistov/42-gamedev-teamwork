// Правила CSP для SSR (заголовок) и GitHub Pages (meta) по docs/csp.md

export const CSP_ORIGINS = {
  praktikumApi: 'https://ya-praktikum.tech',
  yandexOAuth: 'https://oauth.yandex.ru',
  googleFontsCss: 'https://fonts.googleapis.com',
  googleFontsStatic: 'https://fonts.gstatic.com',
} as const

function isDevEnv(): boolean {
  return process.env.NODE_ENV === 'development'
}

function isGhPagesStaticBuild(): boolean {
  const flag = process.env.VITE_STATIC_DEPLOY
  return flag === 'gh-pages'
}

/** Только для прода с валидным TLS (Let's Encrypt). На IP + :9000 ломает загрузку ассетов. */
function shouldUpgradeInsecureRequests(): boolean {
  return process.env.CSP_UPGRADE_INSECURE === '1'
}

// Сериализация директив в значение заголовка / meta
export function formatCspHeader(directives: Record<string, string[]>): string {
  return Object.entries(directives)
    .map(([name, values]) => {
      if (values.length === 0) {
        return name
      }
      return `${name} ${values.join(' ')}`
    })
    .join('; ')
}

// SSR и preview: nonce для window.APP_INITIAL_STATE
export function buildSsrCspDirectives(nonce: string): Record<string, string[]> {
  const scriptSrc = ["'self'", `'nonce-${nonce}'`]
  const connectSrc = [
    "'self'",
    CSP_ORIGINS.praktikumApi,
    CSP_ORIGINS.yandexOAuth,
  ]
  const styleSrc = ["'self'", "'unsafe-inline'", CSP_ORIGINS.googleFontsCss]
  const styleSrcElem = ["'self'", "'unsafe-inline'", CSP_ORIGINS.googleFontsCss]
  const fontSrc = ["'self'", 'data:', CSP_ORIGINS.googleFontsStatic]

  if (isDevEnv()) {
    scriptSrc.push("'unsafe-eval'")
    connectSrc.push('ws:', 'wss:', 'http://localhost:*', 'http://127.0.0.1:*')
  }

  const directives: Record<string, string[]> = {
    'default-src': ["'self'"],
    'base-uri': ["'self'"],
    'script-src': scriptSrc,
    'style-src': styleSrc,
    'style-src-elem': styleSrcElem,
    'img-src': ["'self'", 'data:', 'blob:', 'https:'],
    'font-src': fontSrc,
    'connect-src': connectSrc,
    'frame-src': [CSP_ORIGINS.yandexOAuth],
    'form-action': ["'self'", CSP_ORIGINS.yandexOAuth],
    'manifest-src': ["'self'"],
    'worker-src': ["'self'"],
    'object-src': ["'none'"],
  }

  if (!isDevEnv() && shouldUpgradeInsecureRequests()) {
    directives['upgrade-insecure-requests'] = []
  }

  return directives
}

export function buildSsrCspHeader(nonce: string): string {
  return formatCspHeader(buildSsrCspDirectives(nonce))
}

// Статика GitHub Pages: без nonce, без API нашего Node
export function buildGhPagesCspDirectives(): Record<string, string[]> {
  return {
    'default-src': ["'self'"],
    'base-uri': ["'self'"],
    'script-src': ["'self'"],
    'style-src': ["'self'", "'unsafe-inline'"],
    'img-src': ["'self'", 'data:', 'blob:', 'https:'],
    'font-src': ["'self'", 'data:'],
    'connect-src': ["'self'", CSP_ORIGINS.praktikumApi],
    'form-action': ["'self'"],
    'manifest-src': ["'self'"],
    'worker-src': ["'self'"],
    'object-src': ["'none'"],
    'upgrade-insecure-requests': [],
  }
}

export function buildGhPagesCspMetaContent(): string {
  return formatCspHeader(buildGhPagesCspDirectives())
}

export function shouldInjectGhPagesCspMeta(): boolean {
  return isGhPagesStaticBuild()
}
