export const LEADERBOARD_RATING_FIELD =
  'cosmicMatch42_bestScore' as const
export const RATING_FIELD_NAME: string =
  'CM42_score' as const

export interface LeaderboardEntry {
  id: number
  nickname: string
  avatarEmoji: string
  [RATING_FIELD_NAME]: number // текущий счет
  gamesPlayed: number // сыграно игр
  bestScore: number // рекорд одной игры
  bestScoreDate: string // дата рекорда
}
