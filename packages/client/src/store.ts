import {
  useDispatch as useDispatchBase,
  useSelector as useSelectorBase,
  TypedUseSelectorHook,
  useStore as useStoreBase,
} from 'react-redux'
import { combineReducers } from 'redux'
import { configureStore } from '@reduxjs/toolkit'

import forumReducer from './slices/forumSlice'
import friendsReducer from './slices/friendsSlice'
import ssrReducer from './slices/ssrSlice'
import userReducer from './slices/userSlice'

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
  ssr: ssrReducer,
  user: userReducer,
})

export type RootState = ReturnType<typeof reducer>

export const createAppStore = (
  preloadedState?: RootState
) =>
  configureStore({
    reducer,
    preloadedState,
  })

function readAndConsumeInitialState():
  | RootState
  | undefined {
  if (typeof window === 'undefined') {
    return undefined
  }

  const state = window.APP_INITIAL_STATE
  // После инициализации стор сам хранит state, глобальная ссылка больше не нужна.
  delete window.APP_INITIAL_STATE
  return state
}

export const store = createAppStore(
  readAndConsumeInitialState()
)

export type AppDispatch = typeof store.dispatch

export const useDispatch: () => AppDispatch =
  useDispatchBase
export const useSelector: TypedUseSelectorHook<RootState> =
  useSelectorBase
export const useStore: () => typeof store =
  useStoreBase
