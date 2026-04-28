import {
  createAsyncThunk,
  createSlice,
  PayloadAction,
} from '@reduxjs/toolkit'
import { RootState } from '../store'
import { fetchLeaderboardPage } from '../shared/api/leaderboardApi'
import { type LeaderboardEntry } from '../shared/api/leaderboardConfig'

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
  createAsyncThunk<unknown>(
    'leaderboard/fetchLeaderboardThunk',
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async (_: void) => {
      return await fetchLeaderboardPage({
        cursor: 0,
        limit: 10,
      })
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
