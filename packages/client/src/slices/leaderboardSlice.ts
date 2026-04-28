import {
  createAsyncThunk,
  createSlice,
  PayloadAction,
} from '@reduxjs/toolkit'
import { RootState } from '../store'

export interface LeaderboardEntry {
  id: number
  nickname: string
  avatarEmoji: string
  rating: number // общий рейтинг (сумма очков за всё время)
  gamesPlayed: number // сыграно игр
  bestScore: number // рекорд одной игры
  bestScoreDate: string // дата рекорда
}

export interface LeaderboardState {
  data: Array<LeaderboardEntry>
  isLoading: boolean
  error: string | null
  limit: number
  cursor: number
}

const initialState: LeaderboardState = {
  data: [],
  isLoading: false,
  error: null,
  limit: 10,
  cursor: 0,
}

export const fetchLeaderboardThunk =
  createAsyncThunk(
    'leaderboard/fetchLeaderboardThunk',
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async (_: void) => {
      const url = `https://ya-praktikum.tech/api/v2/leaderboard`
      console.log(url)
      return fetch(url, {
        method: 'POST',
      }).then(res => res.json())
    }
  )

export const leaderboardSlice = createSlice({
  name: 'leaderboard',
  initialState,
  reducers: {},
  extraReducers: builder => {
    builder
      .addCase(
        fetchLeaderboardThunk.pending.type,
        state => {
          state.data = []
          state.isLoading = true
        }
      )
      .addCase(
        fetchLeaderboardThunk.fulfilled.type,
        (
          state,
          {
            payload,
          }: PayloadAction<LeaderboardEntry[]>
        ) => {
          state.data = payload
          state.isLoading = false
        }
      )
      .addCase(
        fetchLeaderboardThunk.rejected.type,
        state => {
          state.isLoading = false
        }
      )
  },
})

export const leaderboardData = (
  state: RootState
) => state.leaderboard.data

export const isLoadingLeaderboard = (
  state: RootState
) => state.leaderboard.isLoading

export default leaderboardSlice.reducer
