import {
  buildGhPagesCspDirectives,
  buildSsrCspDirectives,
  buildSsrCspHeader,
  formatCspHeader,
  CSP_ORIGINS,
} from './cspPolicy'

describe('cspPolicy', () => {
  const originalNodeEnv = process.env.NODE_ENV

  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv
  })

  it('formatCspHeader joins directives', () => {
    expect(
      formatCspHeader({
        'default-src': ["'self'"],
        'object-src': ["'none'"],
      })
    ).toBe("default-src 'self'; object-src 'none'")
  })

  it('SSR policy includes nonce and Praktikum API', () => {
    process.env.NODE_ENV = 'production'
    const directives = buildSsrCspDirectives('test-nonce')
    expect(directives['script-src']).toEqual(
      expect.arrayContaining(["'self'", "'nonce-test-nonce'"])
    )
    expect(directives['connect-src']).toContain(CSP_ORIGINS.praktikumApi)
    expect(directives['style-src-elem']).toContain(CSP_ORIGINS.googleFontsCss)
    expect(directives['font-src']).toContain(CSP_ORIGINS.googleFontsStatic)
    expect(buildSsrCspHeader('abc')).toContain("'nonce-abc'")
  })

  it('dev SSR allows Vite HMR', () => {
    process.env.NODE_ENV = 'development'
    const directives = buildSsrCspDirectives('n')
    expect(directives['script-src']).toContain("'unsafe-eval'")
    expect(directives['connect-src']).toContain('ws:')
  })

  it('GH Pages policy has no nonce and no OAuth connect', () => {
    const directives = buildGhPagesCspDirectives()
    expect(directives['script-src']).toEqual(["'self'"])
    expect(directives['connect-src']).not.toContain(CSP_ORIGINS.yandexOAuth)
  })
})
