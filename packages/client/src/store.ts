import {
  useDispatch as useDispatchBase,
  useSelector as useSelectorBase,
  TypedUseSelectorHook,
  useStore as useStoreBase,
} from 'react-redux'
import { combineReducers } from 'redux'
import { configureStore } from '@reduxjs/toolkit'

import forumReducer, {
  clearForumAuthRedirect,
} from './slices/forumSlice'
import friendsReducer from './slices/friendsSlice'
import leaderboardReducer from './slices/leaderboardSlice'
import ssrReducer from './slices/ssrSlice'
import userReducer, {
  resetAuthChecked,
} from './slices/userSlice'

// Глобально декларируем в window наш ключик
// и задаем ему тип такой же как у стейта в сторе
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

export const store = configureStore({
  reducer: {
    forum: forumReducer,
    friends: friendsReducer,
    leaderboard: leaderboardReducer,
    ssr: ssrReducer,
    user: userReducer,
  },
})

export type RootState = ReturnType<
  typeof store.getState
>
export type AppDispatch = typeof store.dispatch

export const useDispatch: () => AppDispatch =
  useDispatchBase
export const useSelector: TypedUseSelectorHook<RootState> =
  useSelectorBase
export const useStore: () => typeof store =
  useStoreBase
