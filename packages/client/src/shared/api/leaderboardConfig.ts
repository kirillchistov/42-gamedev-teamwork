export const RATING_FIELD_NAME: string =
  'CM42_score' as const
// export const TEAM_NAME = 'cosmic-match-42' as const
export const TEAM_NAME =
  'cosmicMatch42_bestScore' as const

export interface LeaderboardEntry {
  id: number
  nickname?: string
  avatarEmoji?: string
  [RATING_FIELD_NAME]?: number // текущий счет
  gamesPlayed?: number // сыграно игр
  bestScore?: number // рекорд одной игры
  bestScoreDate?: string // дата рекорда
}

export type LeaderboardApiRow = {
  data: Record<string, unknown>
}

export type LeaderboardUiEntry = {
  id: number
  nickname: string
  avatar: string | null
  score: number
  gamesPlayed: number
  bestScore: number
  bestScoreDate: string
}

export type LeaderboardApiData = {
  [key: string]: number | string | null
  // userId: number
  // nickname: string
  // avatar: string | null
  // [RATING_FIELD_NAME]: number
  // gamesPlayed: number
  // bestScore: number
  // bestScoreDate: string
}
