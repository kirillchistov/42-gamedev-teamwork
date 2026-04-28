export const LEADERBOARD_RATING_FIELD =
  'cosmicMatch42_bestScore' as const

export type LeaderboardTeamData = {
  login: string
  displayName: string
  [LEADERBOARD_RATING_FIELD]: number
}
