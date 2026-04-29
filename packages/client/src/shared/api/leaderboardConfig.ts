export const TEAM_NAME =
  'cosmicMatch42_bestScore' as const

export interface LeaderboardEntry {
  id: number
  nickname: string
  avatar?: string | null
  CM42_score: number // текущий счет
  bestScore: number // рекорд одной игры
  bestScoreDate: string // дата рекорда
}

export type LeaderboardApiRow = {
  data: Record<string, unknown>
}
