import {
  clearGhPagesDemoSession,
  GH_PAGES_DEMO_LOGIN,
  GH_PAGES_DEMO_PASSWORD,
  isGhPagesDemoSessionActive,
  matchesGhPagesDemoCredentials,
  saveGhPagesDemoSession,
} from './ghPagesDemoAuth'

describe('ghPagesDemoAuth', () => {
  beforeEach(() => {
    clearGhPagesDemoSession()
  })

  it('matches demo credentials', () => {
    expect(
      matchesGhPagesDemoCredentials(GH_PAGES_DEMO_LOGIN, GH_PAGES_DEMO_PASSWORD)
    ).toBe(true)
    expect(matchesGhPagesDemoCredentials(GH_PAGES_DEMO_LOGIN, 'wrong')).toBe(
      false
    )
  })

  it('tracks session in sessionStorage', () => {
    expect(isGhPagesDemoSessionActive()).toBe(false)
    saveGhPagesDemoSession()
    expect(isGhPagesDemoSessionActive()).toBe(true)
    clearGhPagesDemoSession()
    expect(isGhPagesDemoSessionActive()).toBe(false)
  })
})
