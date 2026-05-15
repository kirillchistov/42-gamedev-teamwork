import {
  DEFAULT_LANDING_THEME,
  isLandingThemeId,
} from '../constants/landingThemes'

describe('landingThemes', () => {
  it('accepts whitelist values', () => {
    expect(isLandingThemeId('light-flat')).toBe(
      true
    )
    expect(isLandingThemeId('dark-neon')).toBe(
      true
    )
  })

  it('rejects unknown theme', () => {
    expect(isLandingThemeId('neon')).toBe(false)
    expect(isLandingThemeId(null)).toBe(false)
  })

  it('has default', () => {
    expect(DEFAULT_LANDING_THEME).toBe(
      'light-flat'
    )
  })
})
