import {
  describe,
  it,
  expect,
  jest,
  afterEach,
} from '@jest/globals'
import { configureStore } from '@reduxjs/toolkit'
import userReducer, {
  setUser,
  clearUser,
  patchUserProfile,
  updateUserAvatar,
  fetchUserThunk,
  loginThunk,
  logoutThunk,
  selectUser,
  selectIsAuthenticated,
  selectUserIsLoading,
  selectUserError,
} from './userSlice'
import type { User } from '../types/user'
import type { RootState } from '../store'

describe('userSlice', () => {
  const mockUser: User = {
    id: 1,
    first_name: 'Test',
    second_name: 'User',
    display_name: 'testuser',
    login: 'testuser',
    email: 'test@example.com',
    phone: '+1234567890',
    avatar: '/path/to/avatar.jpg',
  }

  describe('sync reducers', () => {
    it('setUser should set user data', () => {
      const state = userReducer(
        undefined,
        setUser(mockUser)
      )
      expect(state.data).toEqual(mockUser)
      expect(state.error).toBeNull()
    })

    it('setUser with null should clear user', () => {
      const initialState = {
        data: mockUser,
        isLoading: false,
        isAuthChecked: true,
        error: null,
      }
      const state = userReducer(
        initialState,
        setUser(null)
      )
      expect(state.data).toBeNull()
      expect(state.isAuthChecked).toBe(true)
    })

    it('clearUser should clear all user data', () => {
      const initialState = {
        data: mockUser,
        isLoading: false,
        isAuthChecked: true,
        error: 'some error',
      }
      const state = userReducer(
        initialState,
        clearUser()
      )
      expect(state.data).toBeNull()
      expect(state.error).toBeNull()
      expect(state.isLoading).toBe(false)
    })

    it('patchUserProfile should partially update user', () => {
      const initialState = {
        data: mockUser,
        isLoading: false,
        isAuthChecked: true,
        error: null,
      }
      const state = userReducer(
        initialState,
        patchUserProfile({
          first_name: 'Updated',
          email: 'new@example.com',
        })
      )
      expect(state.data?.first_name).toBe(
        'Updated'
      )
      expect(state.data?.email).toBe(
        'new@example.com'
      )
      expect(state.data?.id).toBe(1)
    })

    it('updateUserAvatar should update avatar only', () => {
      const initialState = {
        data: mockUser,
        isLoading: false,
        isAuthChecked: true,
        error: null,
      }
      const state = userReducer(
        initialState,
        updateUserAvatar('/new/avatar.jpg')
      )
      expect(state.data?.avatar).toBe(
        '/new/avatar.jpg'
      )
      expect(state.data?.first_name).toBe('Test')
    })
  })

  describe('thunks pending states', () => {
    it('fetchUserThunk pending', () => {
      const action = {
        type: fetchUserThunk.pending.type,
      }
      const state = userReducer(undefined, action)
      expect(state.isLoading).toBe(true)
      expect(state.error).toBeNull()
    })

    it('loginThunk pending', () => {
      const action = {
        type: loginThunk.pending.type,
      }
      const state = userReducer(undefined, action)
      expect(state.isLoading).toBe(true)
      expect(state.error).toBeNull()
    })

    it('logoutThunk fulfilled', () => {
      const initialState = {
        data: mockUser,
        isLoading: true,
        isAuthChecked: true,
        error: null,
      }
      const action = {
        type: logoutThunk.fulfilled.type,
      }
      const state = userReducer(
        initialState,
        action
      )
      expect(state.data).toBeNull()
      expect(state.isLoading).toBe(false)
      expect(state.isAuthChecked).toBe(true)
    })
  })

  describe('login integration', () => {
    afterEach(() => {
      jest.restoreAllMocks()
    })

    it('shows friendly message when signin ok but /auth/user returns 401', async () => {
      const fetchMock = jest.fn() as jest.Mock
      // POST /auth/signin -> ok
      fetchMock.mockImplementationOnce(() =>
        Promise.resolve({
          ok: true,
          json: async () => ({}),
        } as Response)
      )
      // GET /auth/user -> 401
      fetchMock.mockImplementationOnce(() =>
        Promise.resolve({
          ok: false,
          status: 401,
          json: async () => ({
            reason: 'Unauthorized',
          }),
        } as Response)
      )

      Object.defineProperty(global, 'fetch', {
        value: fetchMock,
        configurable: true,
        writable: true,
      })

      const store = configureStore({
        reducer: { user: userReducer },
      })

      const action = await store.dispatch(
        loginThunk({
          login: 'testuser',
          password: 'password123',
        })
      )

      expect(
        loginThunk.rejected.match(action)
      ).toBe(true)
      expect(action.payload).toBe(
        'Вход выполнен, но сессия не подтвердилась. Попробуйте войти еще раз.'
      )
      expect(store.getState().user.error).toBe(
        'Вход выполнен, но сессия не подтвердилась. Попробуйте войти еще раз.'
      )
    })

    it('shows conflict message when signin returns already in system and /auth/user returns 401', async () => {
      const fetchMock = jest.fn() as jest.Mock
      // POST /auth/signin -> "already in system"
      fetchMock.mockImplementationOnce(() =>
        Promise.resolve({
          ok: false,
          status: 400,
          json: async () => ({
            reason: 'User already in system',
          }),
        } as Response)
      )
      // GET /auth/user -> 401
      fetchMock.mockImplementationOnce(() =>
        Promise.resolve({
          ok: false,
          status: 401,
          json: async () => ({
            reason: 'Unauthorized',
          }),
        } as Response)
      )

      Object.defineProperty(global, 'fetch', {
        value: fetchMock,
        configurable: true,
        writable: true,
      })

      const store = configureStore({
        reducer: { user: userReducer },
      })

      const action = await store.dispatch(
        loginThunk({
          login: 'testuser',
          password: 'password123',
        })
      )

      expect(
        loginThunk.rejected.match(action)
      ).toBe(true)
      expect(action.payload).toBe(
        'Аккаунт уже активен на другом устройстве. Выйдите из аккаунта там и повторите вход.'
      )
      expect(store.getState().user.error).toBe(
        'Аккаунт уже активен на другом устройстве. Выйдите из аккаунта там и повторите вход.'
      )
    })
  })

  describe('selectors', () => {
    // Создаём частичный стейт только для user
    const mockRootState = {
      user: {
        data: mockUser,
        isLoading: false,
        isAuthChecked: true,
        error: null,
      },
    } as unknown as RootState

    it('selectUser should return user data', () => {
      expect(selectUser(mockRootState)).toEqual(
        mockUser
      )
    })

    it('selectIsAuthenticated should return true when user exists', () => {
      expect(
        selectIsAuthenticated(mockRootState)
      ).toBe(true)
    })

    it('selectIsAuthenticated should return false when user is null', () => {
      const emptyRootState = {
        user: {
          data: null,
          isLoading: false,
          isAuthChecked: true,
          error: null,
        },
      } as unknown as RootState
      expect(
        selectIsAuthenticated(emptyRootState)
      ).toBe(false)
    })

    it('selectUserIsLoading should return loading state', () => {
      expect(
        selectUserIsLoading(mockRootState)
      ).toBe(false)
    })

    it('selectUserError should return error', () => {
      const errorRootState = {
        user: {
          ...mockRootState.user,
          error: 'Something went wrong',
        },
      } as unknown as RootState
      expect(
        selectUserError(errorRootState)
      ).toBe('Something went wrong')
    })
  })
})
