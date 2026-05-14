import { FORUM_EMOJI_WHITELIST } from '../constants/forumEmojis'

const allowed = new Set<string>(
  FORUM_EMOJI_WHITELIST as unknown as string[]
)

export function isAllowedForumReactionEmoji(
  emoji: string
): boolean {
  return allowed.has(emoji)
}
