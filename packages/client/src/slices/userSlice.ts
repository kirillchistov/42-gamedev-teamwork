// RTK слайс для работы с данными юзера
/** Изменения и починка Sprint6 Chores
 * 1. Единый таймаут сетевых запросов авторизации -> не зависать на отвалившемся API
 * 2. Обработка ошибки logged юзера (есть cookie) логина User already in system
 * 3. Проверяем сессию, пробуем /auth/user
 * 4. Если отвалилась сеть/таймаут: локально очищаем сессию'
 * 5. Добавлены sync reducers для обновления профиля без лишних запросов
 **/
import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit'
import type { RootState } from '../store'
import { getBaseUrl } from '../constants'
import type { LoginCredentials, SignupData, User } from '../types/user'
import { waitForGhPagesServiceWorker } from '../shared/ghPagesPraktikumProxy'
import { isStaticGhPagesDeploy } from '../shared/staticDeploy'
import {
  cancelScheduledTimeout,
  delayMs,
  scheduleTimeout,
} from '../shared/isomorphicTimer'
import { humanizePraktikumAuthReason } from '../shared/utils/praktikumAuthErrors'
import { userApi, ProfileData } from '../shared/api/userApi'

// Единый таймаут сетевых запросов авторизации
const AUTH_REQUEST_TIMEOUT_MS = 12_000
const AUTH_RELOGIN_CONFLICT_MESSAGE =
  'Аккаунт уже активен на другом устройстве. Выйдите из аккаунта там и повторите вход.'
const AUTH_SESSION_CONFIRMATION_FAILED_MESSAGE =
  'Не удалось завершить вход. Обновите страницу и попробуйте ещё раз.'
const AUTH_SESSION_CONFIRM_RETRIES = 4
const AUTH_SESSION_CONFIRM_RETRY_MS = 200

function fetchWithTimeout(
  url: string,
  init: RequestInit = {}
): Promise<Response> {
  const controller = new AbortController()
  const tid = scheduleTimeout(() => {
    controller.abort()
  }, AUTH_REQUEST_TIMEOUT_MS)
  return fetch(url, {
    ...init,
    signal: controller.signal,
  }).finally(() => {
    cancelScheduledTimeout(tid)
  })
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  let timeoutId: ReturnType<typeof scheduleTimeout> | null = null
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = scheduleTimeout(() => {
      reject(new Error('timeout'))
    }, ms)
  })
  return Promise.race([promise, timeoutPromise]).finally(() => {
    cancelScheduledTimeout(timeoutId)
  }) as Promise<T>
}

// Обработка ошибки logged юзера логина User already in system
function isAlreadyLoggedInError(message: string): boolean {
  const m = message.toLowerCase()
  return (
    (m.includes('already') && (m.includes('system') || m.includes('logged'))) ||
    m.includes('already in system') ||
    m.includes('уже в системе') ||
    m.includes('уже авторизован')
  )
}

function isUnauthorizedMessage(message: string): boolean {
  const m = message.toLowerCase()
  return m.includes('unauthorized') || m.includes('не авторизован')
}

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

const fetchCurrentUser = async (): Promise<User> => {
  const res = await fetchWithTimeout(`${getBaseUrl()}/auth/user`, {
    credentials: 'include',
  })

  if (!res.ok) {
    throw new Error('Unauthorized')
  }

  return (await res.json()) as Promise<User>
}

/**
 * Сброс старой сессии Практикума перед signin (битые cookie на мобильном Safari).
 */
async function clearAuthSessionBeforeLogin(): Promise<void> {
  try {
    await fetchWithTimeout(`${getBaseUrl()}/auth/logout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    })
  } catch {
    /* сеть/таймаут — всё равно пробуем signin */
  }
}

// После signin cookie на мобилке иногда с задержкой
// Делаем несколько попыток /auth/user
async function fetchCurrentUserWithRetry(): Promise<User> {
  let lastError: unknown = new Error('Unauthorized')
  for (let attempt = 0; attempt < AUTH_SESSION_CONFIRM_RETRIES; attempt += 1) {
    try {
      return await fetchCurrentUser()
    } catch (e) {
      lastError = e
      if (attempt < AUTH_SESSION_CONFIRM_RETRIES - 1) {
        await delayMs(AUTH_SESSION_CONFIRM_RETRY_MS)
      }
    }
  }
  throw lastError
}

const readErrorReason = async (response: Response, fallback: string) => {
  const data = await response.json().catch(() => ({}))

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

export const fetchUserThunk = createAsyncThunk('user/fetchUser', async () => {
  if (isStaticGhPagesDeploy()) {
    await waitForGhPagesServiceWorker()
  }
  return fetchCurrentUser()
})

export const loginThunk = createAsyncThunk(
  'user/login',
  async (credentials: LoginCredentials, { rejectWithValue }) => {
    if (isStaticGhPagesDeploy()) {
      await waitForGhPagesServiceWorker()
    }
    await clearAuthSessionBeforeLogin()

    const signinRes = await fetchWithTimeout(`${getBaseUrl()}/auth/signin`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(credentials),
    })

    if (!signinRes.ok) {
      const reason = await readErrorReason(signinRes, 'Ошибка входа')
      // Конфликт активной сессии: показываем понятный сценарий для "входа с другого устройства".
      if (isAlreadyLoggedInError(reason)) {
        try {
          return await fetchCurrentUserWithRetry()
        } catch {
          return rejectWithValue(AUTH_RELOGIN_CONFLICT_MESSAGE)
        }
      }
      if (isUnauthorizedMessage(reason)) {
        return rejectWithValue('Неверный логин или пароль')
      }
      return rejectWithValue(humanizePraktikumAuthReason(reason))
    }

    try {
      return await fetchCurrentUserWithRetry()
    } catch {
      return rejectWithValue(AUTH_SESSION_CONFIRMATION_FAILED_MESSAGE)
    }
  }
)

export const signupThunk = createAsyncThunk(
  'user/signup',
  async (data: SignupData, { rejectWithValue }) => {
    if (isStaticGhPagesDeploy()) {
      await waitForGhPagesServiceWorker()
    }
    await clearAuthSessionBeforeLogin()

    const signupRes = await fetchWithTimeout(`${getBaseUrl()}/auth/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(data),
    })

    if (!signupRes.ok) {
      const reason = await readErrorReason(signupRes, 'Ошибка регистрации')
      return rejectWithValue(humanizePraktikumAuthReason(reason))
    }

    try {
      return await fetchCurrentUserWithRetry()
    } catch {
      return rejectWithValue(AUTH_SESSION_CONFIRMATION_FAILED_MESSAGE)
    }
  }
)

export const logoutThunk = createAsyncThunk('user/logout', async () => {
  try {
    await withTimeout(userApi.logout(), AUTH_REQUEST_TIMEOUT_MS)
  } catch {
    console.log('сеть/таймаут: локально очищаем сессию')
  }
})

export const updateProfileThunk = createAsyncThunk(
  'user/updateProfile',
  async (profileData: ProfileData) => {
    return await userApi.updateProfile(profileData)
  }
)

export const updateAvatarThunk = createAsyncThunk(
  'user/updateAvatar',
  async (file: File) => {
    return await userApi.updateAvatar(file)
  }
)

export const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setUser: (state, action: PayloadAction<User | null>) => {
      state.data = action.payload
      if (action.payload === null) {
        state.error = null
        state.isAuthChecked = true
      }
    },
    clearUser: state => {
      state.data = null
      state.error = null
      state.isLoading = false
      state.isAuthChecked = true
    },
    /** После SSR без cookie сессия помечена проверенной без user — перепроверяем на клиенте. */
    resetAuthChecked: state => {
      state.isAuthChecked = false
      state.isLoading = false
    },
    patchUserProfile: (state, action: PayloadAction<Partial<User>>) => {
      if (state.data) {
        state.data = {
          ...state.data,
          ...action.payload,
        }
      }
    },
    updateUserAvatar: (state, action: PayloadAction<string>) => {
      if (state.data) {
        state.data.avatar = action.payload
      }
    },
  },
  extraReducers: builder => {
    builder
      .addCase(fetchUserThunk.pending, state => {
        state.isLoading = true
        state.error = null
      })
      .addCase(
        fetchUserThunk.fulfilled,
        (state, { payload }: PayloadAction<User>) => {
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
        (state, { payload }: PayloadAction<User>) => {
          state.data = payload
          state.isLoading = false
          state.isAuthChecked = true
          state.error = null
        }
      )
      .addCase(loginThunk.rejected, (state, action) => {
        state.isLoading = false
        state.isAuthChecked = true
        state.error = (action.payload as string) ?? action.error.message ?? null
      })

    builder
      .addCase(signupThunk.pending, state => {
        state.isLoading = true
        state.error = null
      })
      .addCase(
        signupThunk.fulfilled,
        (state, { payload }: PayloadAction<User>) => {
          state.data = payload
          state.isLoading = false
          state.isAuthChecked = true
          state.error = null
        }
      )
      .addCase(signupThunk.rejected, (state, action) => {
        state.isLoading = false
        state.isAuthChecked = true
        state.error = (action.payload as string) ?? action.error.message ?? null
      })

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
      .addCase(logoutThunk.rejected, state => {
        state.data = null
        state.isLoading = false
        state.isAuthChecked = true
        state.error = null
      })

    builder
      .addCase(updateProfileThunk.pending, state => {
        state.isLoading = true
        state.error = null
      })
      .addCase(updateProfileThunk.fulfilled, (state, { payload }) => {
        state.data = payload
        state.isLoading = false
        state.error = null
      })
      .addCase(updateProfileThunk.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.error.message || 'Ошибка обновления профиля'
      })

    builder
      .addCase(updateAvatarThunk.pending, state => {
        state.isLoading = true
        state.error = null
      })
      .addCase(updateAvatarThunk.fulfilled, (state, { payload }) => {
        if (state.data) {
          state.data.avatar = payload.avatar
        }
        state.isLoading = false
        state.error = null
      })
      .addCase(updateAvatarThunk.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.error.message || 'Ошибка обновления аватара'
      })
  },
})

export const {
  setUser,
  clearUser,
  resetAuthChecked,
  patchUserProfile,
  updateUserAvatar,
} = userSlice.actions

export const selectUser = (state: RootState) => state.user.data
export const selectUserIsLoading = (state: RootState) => state.user.isLoading
export const selectUserIsAuthChecked = (state: RootState) =>
  state.user.isAuthChecked
export const selectUserIsInitialized = (state: RootState) =>
  state.user.isAuthChecked
export const selectUserError = (state: RootState) => state.user.error
export const selectIsAuthenticated = (state: RootState) => !!state.user.data
export const selectUserProfile = (state: RootState) => state.user.data
export const selectUserAvatar = (state: RootState) =>
  state.user.data?.avatar || null
export const selectUserDisplayName = (state: RootState) => {
  const user = state.user.data
  if (!user) return ''
  return user.display_name || `${user.first_name} ${user.second_name}`
}

export default userSlice.reducer
