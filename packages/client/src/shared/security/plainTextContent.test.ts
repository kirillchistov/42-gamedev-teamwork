import {
  escapeHtml,
  validateForumContent,
} from './plainTextContent'

describe('plainTextContent (client)', () => {
  it('escapeHtml encodes special characters', () => {
    expect(escapeHtml(`a & b <c>`)).toBe(
      'a &amp; b &lt;c&gt;'
    )
  })

  it('validateForumContent rejects img tag', () => {
    const r = validateForumContent(
      '<img src=x onerror=alert(1)>'
    )
    expect(r.ok).toBe(false)
  })
})
