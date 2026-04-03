import {
  createAsyncThunk,
  createSlice,
  PayloadAction,
} from '@reduxjs/toolkit'
import type { RootState } from '../store'
import { BASE_URL } from '../constants'
import type {
  LoginCredentials,
  SignupData,
  User,
} from '../types/user'

interface UserState {
  data: User | null
  isLoading: boolean
  isAuthChecked: boolean
  error: string | null
}

const initialState: UserState = {
  data: null,
  isLoading: false,
  isAuthChecked: false,
  error: null,
}

const fetchCurrentUser =
  async (): Promise<User> => {
    const res = await fetch(
      `${BASE_URL}/auth/user`,
      {
        credentials: 'include',
      }
    )

    if (!res.ok) {
      throw new Error('Unauthorized')
    }

    return res.json() as Promise<User>
  }

const readErrorReason = async (
  response: Response,
  fallback: string
) => {
  const data = await response
    .json()
    .catch(() => ({}))

  if (
    typeof data === 'object' &&
    data !== null &&
    'reason' in data &&
    typeof data.reason === 'string'
  ) {
    return data.reason
  }

  return fallback
}

export const fetchUserThunk = createAsyncThunk(
  'user/fetchUser',
  async () => fetchCurrentUser()
)

export const loginThunk = createAsyncThunk(
  'user/login',
  async (
    credentials: LoginCredentials,
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
      return rejectWithValue(
        await readErrorReason(
          signinRes,
          'Ошибка входа'
        )
      )
    }

    return fetchCurrentUser()
  }
)

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
      return rejectWithValue(
        await readErrorReason(
          signupRes,
          'Ошибка регистрации'
        )
      )
    }

    return fetchCurrentUser()
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
          state.isAuthChecked = true
          state.error = null
        }
      )
      .addCase(fetchUserThunk.rejected, state => {
        state.data = null
        state.isLoading = false
        state.isAuthChecked = true
        state.error = null
      })

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
          state.isAuthChecked = true
          state.error = null
        }
      )
      .addCase(
        loginThunk.rejected,
        (state, action) => {
          state.isLoading = false
          state.isAuthChecked = true
          state.error =
            (action.payload as string) ??
            action.error.message ??
            null
        }
      )

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
          state.isAuthChecked = true
          state.error = null
        }
      )
      .addCase(
        signupThunk.rejected,
        (state, action) => {
          state.isLoading = false
          state.isAuthChecked = true
          state.error =
            (action.payload as string) ??
            action.error.message ??
            null
        }
      )

    builder
      .addCase(logoutThunk.pending, state => {
        state.isLoading = true
        state.error = null
      })
      .addCase(logoutThunk.fulfilled, state => {
        state.data = null
        state.isLoading = false
        state.isAuthChecked = true
        state.error = null
      })
      .addCase(
        logoutThunk.rejected,
        (state, action) => {
          state.isLoading = false
          state.isAuthChecked = true
          state.error =
            action.error.message ?? null
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
) => state.user.isAuthChecked
export const selectUserIsInitialized = (
  state: RootState
) => state.user.isAuthChecked
export const selectUserError = (
  state: RootState
) => state.user.error

export default userSlice.reducer
