/**
 * Whitelist реакций форума — совпадает с EMOJIS в ForumTopicPage (forum-api-spec §2.3).
 */
export const FORUM_EMOJI_WHITELIST = [
  '😀',
  '👍',
  '❤️',
  '🔥',
  '🎮',
  '⭐',
  '🚀',
  '💡',
  '🤔',
  '😎',
] as const

export type ForumEmoji =
  typeof FORUM_EMOJI_WHITELIST[number]
