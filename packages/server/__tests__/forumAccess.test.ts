import {
  canForumAuthorOrModerator,
  getForumModeratorPraktikumIds,
  isForumModeratorUser,
} from '../routes/forumAccess'
import { isAllowedForumReactionEmoji } from '../routes/forumEmojiGuard'

describe('forumAccess (moderators)', () => {
  let saved: string | undefined

  beforeEach(() => {
    saved =
      process.env.FORUM_MODERATOR_PRAKTIKUM_IDS
  })

  afterEach(() => {
    if (saved === undefined) {
      delete process.env
        .FORUM_MODERATOR_PRAKTIKUM_IDS
    } else {
      process.env.FORUM_MODERATOR_PRAKTIKUM_IDS =
        saved
    }
  })

  it('parses FORUM_MODERATOR_PRAKTIKUM_IDS', () => {
    process.env.FORUM_MODERATOR_PRAKTIKUM_IDS =
      '7, 42  99'
    expect(
      [...getForumModeratorPraktikumIds()].sort(
        (a, b) => a - b
      )
    ).toEqual([7, 42, 99])
    expect(isForumModeratorUser(42)).toBe(true)
    expect(isForumModeratorUser(1)).toBe(false)
  })

  it('author always can edit own resource', () => {
    delete process.env
      .FORUM_MODERATOR_PRAKTIKUM_IDS
    expect(canForumAuthorOrModerator(5, 5)).toBe(
      true
    )
    expect(canForumAuthorOrModerator(9, 5)).toBe(
      false
    )
  })

  it('moderator can edit others resource', () => {
    process.env.FORUM_MODERATOR_PRAKTIKUM_IDS =
      '2'
    expect(canForumAuthorOrModerator(2, 99)).toBe(
      true
    )
    expect(canForumAuthorOrModerator(3, 99)).toBe(
      false
    )
  })
})

describe('forumEmojiGuard', () => {
  it('allows whitelist emoji', () => {
    expect(
      isAllowedForumReactionEmoji('👍')
    ).toBe(true)
  })

  it('rejects unknown emoji', () => {
    expect(
      isAllowedForumReactionEmoji('💀')
    ).toBe(false)
  })
})
