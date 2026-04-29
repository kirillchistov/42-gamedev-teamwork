import {
  RATING_FIELD_NAME,
  type LeaderboardApiRow,
  type LeaderboardUiEntry,
} from './leaderboardConfig'

const asNumber = (
  v: unknown,
  fallback = 0
): number =>
  typeof v === 'number' && Number.isFinite(v)
    ? v
    : fallback

const asString = (
  v: unknown,
  fallback = ''
): string =>
  typeof v === 'string' ? v : fallback

export function mapLeaderboardRowToUi(
  row: LeaderboardApiRow
): LeaderboardUiEntry {
  const d = row.data ?? {}
  return {
    userId: asNumber(d.userId, 0),
    nickname: asString(
      d.nickname,
      'Gaius Anonimous'
    ),
    avatar:
      typeof d.avatarEmoji === 'string' &&
      d.avatarEmoji.length > 0
        ? d.avatarEmoji
        : null,
    score: asNumber(d[RATING_FIELD_NAME], 0),
    gamesPlayed: asNumber(d.gamesPlayed, 0),
    bestScore: asNumber(d.bestScore, 0),
    bestScoreDate: asString(d.bestScoreDate, ''),
  }
}
