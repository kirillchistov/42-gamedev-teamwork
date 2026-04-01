import {
  createAsyncThunk,
  createSlice,
  PayloadAction,
} from '@reduxjs/toolkit'
import { RootState } from '../store'
import { BASE_URL } from '../constants'

export interface User {
  id: number
  first_name: string
  second_name: string
  login: string
  email: string
  phone: string
  avatar: string | null
}

export interface UserState {
  data: User | null
  isLoading: boolean
  isInitialized: boolean
  error: string | null
}

const initialState: UserState = {
  data: null,
  isLoading: false,
  isInitialized: false,
  error: null,
}

export const fetchUserThunk = createAsyncThunk(
  'user/fetchUser',
  async () => {
    const res = await fetch(
      `${BASE_URL}/auth/user`,
      {
        credentials: 'include',
      }
    )
    if (!res.ok) throw new Error('Unauthorized')
    return res.json() as Promise<User>
  }
)

export const loginThunk = createAsyncThunk(
  'user/login',
  async (
    credentials: {
      login: string
      password: string
    },
    { rejectWithValue }
  ) => {
    const signinRes = await fetch(
      `${BASE_URL}/auth/signin`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(credentials),
      }
    )
    if (!signinRes.ok) {
      const data = await signinRes
        .json()
        .catch(() => ({}))
      return rejectWithValue(
        data.reason ?? 'Ошибка входа'
      )
    }
    const userRes = await fetch(
      `${BASE_URL}/auth/user`,
      {
        credentials: 'include',
      }
    )
    if (!userRes.ok)
      throw new Error(
        'Не удалось получить данные пользователя'
      )
    return userRes.json() as Promise<User>
  }
)

export interface SignupData {
  first_name: string
  second_name: string
  login: string
  email: string
  password: string
  phone: string
}

export const signupThunk = createAsyncThunk(
  'user/signup',
  async (
    data: SignupData,
    { rejectWithValue }
  ) => {
    const signupRes = await fetch(
      `${BASE_URL}/auth/signup`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(data),
      }
    )
    if (!signupRes.ok) {
      const err = await signupRes
        .json()
        .catch(() => ({}))
      return rejectWithValue(
        err.reason ?? 'Ошибка регистрации'
      )
    }
    const userRes = await fetch(
      `${BASE_URL}/auth/user`,
      {
        credentials: 'include',
      }
    )
    if (!userRes.ok)
      throw new Error(
        'Не удалось получить данные пользователя'
      )
    return userRes.json() as Promise<User>
  }
)

export const logoutThunk = createAsyncThunk(
  'user/logout',
  async () => {
    await fetch(`${BASE_URL}/auth/logout`, {
      method: 'POST',
      credentials: 'include',
    })
  }
)

export const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {},
  extraReducers: builder => {
    // fetchUser
    builder
      .addCase(fetchUserThunk.pending, state => {
        state.isLoading = true
        state.error = null
      })
      .addCase(
        fetchUserThunk.fulfilled,
        (
          state,
          { payload }: PayloadAction<User>
        ) => {
          state.data = payload
          state.isLoading = false
          state.isInitialized = true
        }
      )
      .addCase(fetchUserThunk.rejected, state => {
        state.data = null
        state.isLoading = false
        state.isInitialized = true
      })

    // login
    builder
      .addCase(loginThunk.pending, state => {
        state.isLoading = true
        state.error = null
      })
      .addCase(
        loginThunk.fulfilled,
        (
          state,
          { payload }: PayloadAction<User>
        ) => {
          state.data = payload
          state.isLoading = false
          state.isInitialized = true
          state.error = null
        }
      )
      .addCase(
        loginThunk.rejected,
        (state, action) => {
          state.isLoading = false
          state.error =
            (action.payload as string) ??
            action.error.message ??
            null
        }
      )

    // signup
    builder
      .addCase(signupThunk.pending, state => {
        state.isLoading = true
        state.error = null
      })
      .addCase(
        signupThunk.fulfilled,
        (
          state,
          { payload }: PayloadAction<User>
        ) => {
          state.data = payload
          state.isLoading = false
          state.isInitialized = true
          state.error = null
        }
      )
      .addCase(
        signupThunk.rejected,
        (state, action) => {
          state.isLoading = false
          state.error =
            (action.payload as string) ??
            action.error.message ??
            null
        }
      )

    // logout
    builder.addCase(
      logoutThunk.fulfilled,
      state => {
        state.data = null
        state.isInitialized = true
      }
    )
  },
})

export const selectUser = (state: RootState) =>
  state.user.data
export const selectUserIsLoading = (
  state: RootState
) => state.user.isLoading
export const selectUserIsAuthChecked = (
  state: RootState
) => state.user.isInitialized
export const selectUserIsInitialized = (
  state: RootState
) => state.user.isInitialized
export const selectUserError = (
  state: RootState
) => state.user.error

export default userSlice.reducer
