import { BASE_URL } from '../../constants'
import {
  type LeaderboardEntry,
  LEADERBOARD_RATING_FIELD,
  RATING_FIELD_NAME,
} from './leaderboardConfig'

export async function submitLeaderboardScore(
  data: LeaderboardEntry
) {
  const res = await fetch(
    `${BASE_URL}/leaderboard`,
    {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        data: { ...data },
        teamName: LEADERBOARD_RATING_FIELD,
        ratingFieldName: RATING_FIELD_NAME,
      }),
    }
  )
  if (!res.ok) {
    throw new Error(
      await res.text().catch(() => res.statusText)
    )
  }
}

export type LeaderboardRow = Record<
  string,
  unknown
>

export async function fetchLeaderboardPage(params: {
  cursor: number
  limit: number
}) {
  const res = await fetch(
    `${BASE_URL}/leaderboard/${LEADERBOARD_RATING_FIELD}`,
    {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ratingFieldName: RATING_FIELD_NAME,
        cursor: params.cursor,
        limit: params.limit,
      }),
    }
  )
  if (!res.ok) {
    throw new Error(
      await res.text().catch(() => res.statusText)
    )
  }
  return res.json() as Promise<{
    leaders: LeaderboardRow[]
    cursor?: number
  }>
}
