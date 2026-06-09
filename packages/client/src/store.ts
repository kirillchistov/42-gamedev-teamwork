import {
  useDispatch as useDispatchBase,
  useSelector as useSelectorBase,
  TypedUseSelectorHook,
  useStore as useStoreBase,
} from 'react-redux'
import { combineReducers } from 'redux'
import { configureStore } from '@reduxjs/toolkit'

import forumReducer, { clearForumAuthRedirect } from './slices/forumSlice'
import friendsReducer from './slices/friendsSlice'
import leaderboardReducer from './slices/leaderboardSlice'
import ssrReducer from './slices/ssrSlice'
import userReducer, { resetAuthChecked } from './slices/userSlice'
import { getBrowserPathname, isAuthShellPath } from './shared/staticDeploy'

declare global {
  interface Window {
    APP_INITIAL_STATE?: RootState
  }
}

export const reducer = combineReducers({
  forum: forumReducer,
  friends: friendsReducer,
  leaderboard: leaderboardReducer,
  ssr: ssrReducer,
  user: userReducer,
})

export type RootState = ReturnType<typeof reducer>

export const createAppStore = (preloadedState?: RootState) =>
  configureStore({
    reducer,
    preloadedState,
  })

function readAndConsumeInitialState(): RootState | undefined {
  if (typeof window === 'undefined') {
    return undefined
  }

  const state = window.APP_INITIAL_STATE
  delete window.APP_INITIAL_STATE
  return state
}

const store = createAppStore(readAndConsumeInitialState())

/**
 * После SSR: сброс «ложной» проверки сессии без user (cookie не дошли до Node).
 * Вызывать только после hydrateRoot, иначе withAuthGuard рендерит loading вместо HTML с сервера.
 */
export function applySsrClientReconciliation(): void {
  if (typeof window === 'undefined') {
    return
  }

  const hydrated = store.getState()
  if (
    hydrated.user.isAuthChecked &&
    !hydrated.user.data &&
    !isAuthShellPath(getBrowserPathname())
  ) {
    store.dispatch(resetAuthChecked())
  }
  if (hydrated.forum.shouldRedirectToLogin) {
    store.dispatch(clearForumAuthRedirect())
  }
}

export { store }

export type AppDispatch = typeof store.dispatch

export const useDispatch: () => AppDispatch = useDispatchBase
export const useSelector: TypedUseSelectorHook<RootState> = useSelectorBase
export const useStore: () => typeof store = useStoreBase
