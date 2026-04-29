import {
  createAsyncThunk,
  createSlice,
  PayloadAction,
} from '@reduxjs/toolkit'
import { RootState } from '../store'
import { fetchTeamLeaderboard } from '../shared/api/leaderboardApi'
import { mapLeaderboardRowToUi } from '../shared/api/leaderboardMapper'
import type {
  LeaderboardUiEntry,
  LeaderboardEntry,
} from '../shared/api/leaderboardConfig'

type LeaderboardState = {
  data: LeaderboardUiEntry[]
  isLoading: boolean
  error: string | null
}

const initialState: LeaderboardState = {
  data: [],
  isLoading: false,
  error: null,
}

export const fetchLeaderboardThunk =
  createAsyncThunk<
    LeaderboardUiEntry[],
    { cursor?: number; limit?: number }
  >(
    'leaderboard/fetch',
    async ({ cursor = 0, limit = 10 }) => {
      const rows = await fetchTeamLeaderboard({
        cursor,
        limit,
      })
      const mapped = rows.map(
        mapLeaderboardRowToUi
      )
      console.log(
        'mapLeaderboardRowToUi',
        rows,
        mapped
      )
      return mapped
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
        (
          state,
          {
            payload,
            error,
          }: PayloadAction<LeaderboardEntry[]>
        ) => {
          state.error =
            (payload as string) ??
            error.message ??
            null
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
