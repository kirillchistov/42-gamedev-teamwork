import {
  createAsyncThunk,
  createSlice,
  PayloadAction,
} from '@reduxjs/toolkit'
import { RootState } from '../store'
import { fetchTeamLeaderboard } from '../shared/api/leaderboardApi'
import { mapLeaderboardRowToUi } from '../shared/api/leaderboardMapper'
import type { LeaderboardEntry } from '../shared/api/leaderboardConfig'

type LeaderboardState = {
  data: LeaderboardEntry[]
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
    LeaderboardEntry[],
    { cursor?: number; limit?: number },
    { rejectValue: string }
  >(
    'leaderboard/fetch',
    async (
      { cursor = 0, limit = 10 },
      thunkAPI
    ) => {
      try {
        const rows = await fetchTeamLeaderboard({
          cursor,
          limit,
        })
        return rows.map(mapLeaderboardRowToUi)
      } catch (err: any) {
        return thunkAPI.rejectWithValue(
          err.message || 'Unknown error'
        )
      }
    }
  )

export const leaderboardSlice = createSlice({
  name: 'leaderboard',
  initialState,
  reducers: {},
  extraReducers: builder => {
    builder
      .addCase(
        fetchLeaderboardThunk.pending,
        state => {
          state.data = []
          state.isLoading = true
          state.error = null
        }
      )
      .addCase(
        fetchLeaderboardThunk.fulfilled,
        (
          state,
          action: PayloadAction<
            LeaderboardEntry[]
          >
        ) => {
          state.data = action.payload
          state.isLoading = false
        }
      )
      .addCase(
        fetchLeaderboardThunk.rejected,
        (state, action) => {
          state.error =
            action.payload ??
            action.error.message ??
            null
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
