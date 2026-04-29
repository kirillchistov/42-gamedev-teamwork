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

export type LeaderboardUiEntry = {
  id: number
  nickname: string
  avatar: string | null
  score: number
  bestScore: number
  bestScoreDate: string
}

export type LeaderboardApiData = {
  id: number
  nickname: string
  avatar?: string | null
  CM42_score: number // текущий счет
  bestScore: number // рекорд одной игры
  bestScoreDate: string // дата рекорда
  // [key: string]: number | string | null
  // userId: number
  // nickname: string
  // avatar: string | null
  // CM42_score: number
  // gamesPlayed: number
  // bestScore: number
  // bestScoreDate: string
}
