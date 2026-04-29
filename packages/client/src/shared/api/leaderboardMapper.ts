import {
  type LeaderboardApiRow,
  type LeaderboardEntry,
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
): LeaderboardEntry {
  const d = row.data ?? {}
  return {
    id: asNumber(d.userId, 0),
    nickname: asString(
      d.nickname,
      'Gaius Anonimous'
    ),
    avatar:
      typeof d.avatar === 'string' &&
      d.avatar.length > 0
        ? d.avatar
        : null,
    CM42_score: asNumber(d.CM42_score, 0),
    bestScore: asNumber(d.bestScore, 0),
    bestScoreDate: asString(d.bestScoreDate, ''),
  }
}
