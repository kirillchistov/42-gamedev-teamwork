import { getBaseUrl } from '../../constants'
import { isStaticGhPagesDeploy } from '../staticDeploy'
import {
  TEAM_NAME,
  type LeaderboardApiRow,
  LeaderboardEntry,
} from './leaderboardConfig'

const GH_PAGES_LEADERBOARD_KEY = 'cosmic-match:gh-pages-leaderboard'

function readGhPagesLeaderboardRows(): LeaderboardApiRow[] {
  try {
    const raw = sessionStorage.getItem(GH_PAGES_LEADERBOARD_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as LeaderboardApiRow[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function writeGhPagesLeaderboardRows(rows: LeaderboardApiRow[]): void {
  sessionStorage.setItem(GH_PAGES_LEADERBOARD_KEY, JSON.stringify(rows))
}

export async function submitLeaderboardScore(data: LeaderboardEntry) {
  if (isStaticGhPagesDeploy()) {
    const rows = readGhPagesLeaderboardRows().filter(
      row => row.data.id !== data.id
    )
    rows.push({ data })
    rows.sort((a, b) => b.data.bestScore - a.data.bestScore)
    writeGhPagesLeaderboardRows(rows)
    return
  }

  const res = await fetch(`${getBaseUrl()}/leaderboard`, {
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
  })
  if (!res.ok) throw new Error(await res.text())
}

export async function fetchTeamLeaderboard(params: {
  cursor: number
  limit: number
}): Promise<LeaderboardApiRow[]> {
  if (isStaticGhPagesDeploy()) {
    const rows = readGhPagesLeaderboardRows()
    return rows.slice(params.cursor, params.cursor + params.limit)
  }

  const res = await fetch(`${getBaseUrl()}/leaderboard/${TEAM_NAME}`, {
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
  })
  if (!res.ok) throw new Error(await res.text())
  return res.json() as Promise<LeaderboardApiRow[]>
}
