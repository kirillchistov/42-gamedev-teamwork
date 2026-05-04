import { BASE_URL } from '../../constants'
import {
  TEAM_NAME,
  type LeaderboardApiRow,
  LeaderboardEntry,
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
        data,
        ratingFieldName: 'CM42_score',
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
        ratingFieldName: 'CM42_score',
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
