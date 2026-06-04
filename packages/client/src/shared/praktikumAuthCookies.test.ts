import { describe, expect, it } from '@jest/globals'
import { filterPraktikumCookieHeader } from './praktikumAuthCookies'

describe('filterPraktikumCookieHeader', () => {
  it('keeps only uuid and authCookie', () => {
    const out = filterPraktikumCookieHeader(
      'uuid=1; authCookie=abc; anonymous_session_id=xyz; other=1'
    )
    expect(out).toBe('uuid=1; authCookie=abc')
  })

  it('returns undefined when no auth cookies', () => {
    expect(
      filterPraktikumCookieHeader('anonymous_session_id=xyz')
    ).toBeUndefined()
  })
})
