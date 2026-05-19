export const TEAM_NAME =
  'cosmicMatch42_bestScore' as const

export interface LeaderboardEntry {
  id: number
  nickname: string
  avatar?: string | null
  CM42_score: number // текущий счет
  bestScore: number // рекорд одной игры
  /** Дата рекорда в API: ISO 8601 YYYY-MM-DD */
  bestScoreDate: string
}

export type LeaderboardApiRow = {
  data: LeaderboardEntry
}
