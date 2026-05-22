import {
  containsForbiddenMarkup,
  validateForumContent,
  validateForumTitle,
} from '../utils/plainTextContent'

describe('plainTextContent', () => {
  it('rejects script-like markup in title', () => {
    const r = validateForumTitle(
      '<script>alert(1)</script>'
    )
    expect(r.ok).toBe(false)
  })

  it('accepts plain title', () => {
    const r = validateForumTitle(
      '  Hello   world  '
    )
    expect(r.ok).toBe(true)
    if (r.ok) {
      expect(r.value).toBe('Hello world')
    }
  })

  it('rejects angle brackets in content', () => {
    expect(
      containsForbiddenMarkup('see <b>bold</b>')
    ).toBe(true)
  })

  it('allows ampersand in plain text', () => {
    const r = validateForumContent('Tom & Jerry')
    expect(r.ok).toBe(true)
  })

  it('strips control characters', () => {
    const r = validateForumContent('ok\u0000text')
    expect(r.ok).toBe(true)
    if (r.ok) {
      expect(r.value).toBe('oktext')
    }
  })
})
