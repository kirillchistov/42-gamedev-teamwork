import {
  ghPagesPraktikumProxyBase,
  rewritePraktikumSetCookie,
} from './ghPagesPraktikumProxy'

describe('ghPagesPraktikumProxy', () => {
  it('builds proxy base under repo subpath', () => {
    expect(ghPagesPraktikumProxyBase('/42-gamedev-teamwork/')).toBe(
      '/42-gamedev-teamwork/api/v2'
    )
    expect(ghPagesPraktikumProxyBase('/')).toBe('/api/v2')
  })

  it('rewrites Domain and Path for Set-Cookie', () => {
    const line =
      'SessionId=abc; Path=/api/v2; Domain=ya-praktikum.tech; Secure; HttpOnly; SameSite=None'
    expect(rewritePraktikumSetCookie(line, '/42-gamedev-teamwork')).toBe(
      'SessionId=abc; Path=/42-gamedev-teamwork/api/v2; Secure; HttpOnly; SameSite=Lax'
    )
  })
})
