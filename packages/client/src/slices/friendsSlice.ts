import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit'
import { RootState } from '../store'
import {
  addFriend,
  fetchFriends,
  removeFriend,
  type AddFriendPayload,
  type FriendRecord,
} from '../shared/api/friendsApi'

export type Friend = FriendRecord

export interface FriendsState {
  data: Friend[]
  isLoading: boolean
  actionError: string | null
}

const initialState: FriendsState = {
  data: [],
  isLoading: false,
  actionError: null,
}

export const fetchFriendsThunk = createAsyncThunk<
  Friend[],
  void,
  { rejectValue: string }
>('friends/fetch', async (_, { rejectWithValue }) => {
  try {
    return await fetchFriends()
  } catch (err) {
    const message =
      err instanceof Error ? err.message : 'Friends request failed'
    return rejectWithValue(message)
  }
})

export const addFriendThunk = createAsyncThunk<
  Friend,
  AddFriendPayload,
  { rejectValue: string }
>('friends/add', async (payload, { rejectWithValue }) => {
  try {
    return await addFriend(payload)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Add friend failed'
    return rejectWithValue(message)
  }
})

export const removeFriendThunk = createAsyncThunk<
  string,
  string,
  { rejectValue: string }
>('friends/remove', async (nickname, { rejectWithValue }) => {
  try {
    await removeFriend(nickname)
    return nickname
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Remove friend failed'
    return rejectWithValue(message)
  }
})

export const friendsSlice = createSlice({
  name: 'friends',
  initialState,
  reducers: {
    clearFriendsActionError(state) {
      state.actionError = null
    },
  },
  extraReducers: builder => {
    builder
      .addCase(fetchFriendsThunk.pending, state => {
        state.isLoading = true
        state.actionError = null
      })
      .addCase(
        fetchFriendsThunk.fulfilled,
        (state, { payload }: PayloadAction<Friend[]>) => {
          state.data = Array.isArray(payload) ? payload : []
          state.isLoading = false
        }
      )
      .addCase(fetchFriendsThunk.rejected, state => {
        state.data = []
        state.isLoading = false
      })
      .addCase(addFriendThunk.pending, state => {
        state.actionError = null
      })
      .addCase(addFriendThunk.fulfilled, (state, { payload }) => {
        const idx = state.data.findIndex(f => f.nickname === payload.nickname)
        if (idx >= 0) {
          state.data[idx] = payload
        } else {
          state.data.push(payload)
        }
        state.data.sort((a, b) => a.nickname.localeCompare(b.nickname, 'ru'))
      })
      .addCase(addFriendThunk.rejected, (state, action) => {
        state.actionError = action.payload ?? action.error.message ?? null
      })
      .addCase(removeFriendThunk.pending, state => {
        state.actionError = null
      })
      .addCase(removeFriendThunk.fulfilled, (state, { payload: nickname }) => {
        state.data = state.data.filter(f => f.nickname !== nickname)
      })
      .addCase(removeFriendThunk.rejected, (state, action) => {
        state.actionError = action.payload ?? action.error.message ?? null
      })
  },
})

export const { clearFriendsActionError } = friendsSlice.actions

export const selectFriends = (state: RootState): Friend[] => {
  const data = state.friends.data
  return Array.isArray(data) ? data : []
}

export const selectFriendNicknames = (state: RootState): Set<string> =>
  new Set(selectFriends(state).map(f => f.nickname))

export const selectIsLoadingFriends = (state: RootState) =>
  state.friends.isLoading

export const selectFriendsActionError = (state: RootState) =>
  state.friends.actionError

export default friendsSlice.reducer
