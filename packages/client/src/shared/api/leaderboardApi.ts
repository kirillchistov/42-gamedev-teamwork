import { BASE_URL } from '../../constants'
import type { LeaderboardTeamData } from './leaderboardConfig'
import { LEADERBOARD_RATING_FIELD } from './leaderboardConfig'

export async function submitLeaderboardScore(
  data: LeaderboardTeamData
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
        data,
        ratingFieldName: LEADERBOARD_RATING_FIELD,
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
    `${BASE_URL}/leaderboard/all`,
    {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ratingFieldName: LEADERBOARD_RATING_FIELD,
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
