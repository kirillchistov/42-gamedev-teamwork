import { BASE_URL } from '../../constants'
import {
  RATING_FIELD_NAME,
  TEAM_NAME,
  type LeaderboardApiData,
  type LeaderboardApiRow,
} from './leaderboardConfig'

export async function submitLeaderboardScore(
  data: LeaderboardApiData
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
        ratingFieldName: RATING_FIELD_NAME,
        teamName: TEAM_NAME,
      }),
    }
  )
  if (!res.ok) throw new Error(await res.text())
}

export async function fetchTeamLeaderboard(params: {
  cursor: number
  limit: number
}): Promise<LeaderboardApiRow[]> {
  const res = await fetch(
    `${BASE_URL}/leaderboard/${TEAM_NAME}`,
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
  if (!res.ok) throw new Error(await res.text())
  return res.json() as Promise<
    LeaderboardApiRow[]
  >
}
