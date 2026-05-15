import {
  createAsyncThunk,
  createSlice,
  PayloadAction,
} from '@reduxjs/toolkit'
import { RootState } from '../store'
import type {
  ForumTopic,
  ForumComment,
  CreateTopicPayload,
  CreateCommentPayload,
} from '../types/forum'

import { forumApi } from '../shared/api/forumApi'

// const DEMO_TOPICS: ForumTopic[] = [
//   {
//     id: 1,
//     title: 'Баланс уровней match-3',
//     author: 'dev-1',
//     createdAt: '2026-03-20T10:00:00Z',
//     content:
//       'Предлагаю обсудить текущий баланс уровней. На 15-м уровне слишком мало ходов для прохождения, а 20-й проходится за пару минут. Нужно выровнять сложность.',
//     commentsCount: 3,
//   },
//   {
//     id: 2,
//     title: 'Идеи новых бомб',
//     author: 'dev-3',
//     createdAt: '2026-03-21T14:30:00Z',
//     content:
//       'Какие новые типы бомб можно добавить в игру? Сейчас есть линейная и радиальная. Может, добавить диагональную или бомбу-молнию?',
//     commentsCount: 5,
//   },
//   {
//     id: 3,
//     title: 'Баги на мобильных устройствах',
//     author: 'tester-1',
//     createdAt: '2026-03-22T09:15:00Z',
//     content:
//       'Собираю список багов на мобильных: тач-события иногда не срабатывают, анимация подтормаживает на старых устройствах.',
//     commentsCount: 2,
//   },
//   {
//     id: 4,
//     title: 'Космические темы для интерфейса',
//     author: 'designer-1',
//     createdAt: '2026-03-23T16:45:00Z',
//     content:
//       'Хочу предложить новые варианты оформления в космическом стиле: тема «Туманность», тема «Чёрная дыра» и тема «Сверхновая».',
//     commentsCount: 1,
//   },
// ]

// const DEMO_COMMENTS: ForumComment[] = [
//   {
//     id: 1,
//     topicId: 1,
//     author: 'dev-2',
//     content:
//       'Согласен, 15-й уровень слишком сложный. Добавить бы пару ходов.',
//     createdAt: '2026-03-20T11:00:00Z',
//     parentCommentId: null,
//   },
//   {
//     id: 2,
//     topicId: 1,
//     author: 'dev-1',
//     content:
//       'Или можно добавить бонусный ход за комбо из 5 элементов.',
//     createdAt: '2026-03-20T11:30:00Z',
//     parentCommentId: 1,
//   },
//   {
//     id: 3,
//     topicId: 1,
//     author: 'tester-1',
//     content:
//       'Протестировал — с 3 дополнительными ходами баланс ок 👍',
//     createdAt: '2026-03-20T14:00:00Z',
//     parentCommentId: null,
//   },
//   {
//     id: 4,
//     topicId: 2,
//     author: 'dev-1',
//     content:
//       'Молния — отличная идея! Может очищать случайный ряд или столбец.',
//     createdAt: '2026-03-21T15:00:00Z',
//     parentCommentId: null,
//   },
//   {
//     id: 5,
//     topicId: 2,
//     author: 'designer-1',
//     content:
//       'Нарисую концепт для молнии и диагональной бомбы 🎨',
//     createdAt: '2026-03-21T15:30:00Z',
//     parentCommentId: 4,
//   },
//   {
//     id: 6,
//     topicId: 3,
//     author: 'dev-2',
//     content:
//       'Тач-события — известная проблема. Попробуй pointer events вместо touch.',
//     createdAt: '2026-03-22T10:00:00Z',
//     parentCommentId: null,
//   },
//   {
//     id: 7,
//     topicId: 4,
//     author: 'dev-3',
//     content:
//       'Тема «Чёрная дыра» звучит круто! Тёмный фон с затягивающей анимацией 🌀',
//     createdAt: '2026-03-23T17:00:00Z',
//     parentCommentId: null,
//   },
// ]

// let demoTopics = [...DEMO_TOPICS]
// let demoComments = [...DEMO_COMMENTS]
// let nextTopicId = 100
// let nextCommentId = 100

export interface ForumState {
  topics: ForumTopic[]
  currentTopic: ForumTopic | null
  comments: ForumComment[]
  isLoading: boolean
  error: string | null
}

const initialState: ForumState = {
  topics: [],
  currentTopic: null,
  comments: [],
  isLoading: false,
  error: null,
}

export const fetchTopicsThunk = createAsyncThunk(
  'forum/fetchTopics',
  async (_, { rejectWithValue }) => {
    try {
      return await forumApi.getTopics()
    } catch (error) {
      return rejectWithValue(
        error instanceof Error
          ? error.message
          : 'Ошибка загрузки топиков'
      )
    }
  }
)

export const fetchTopicByIdThunk =
  createAsyncThunk(
    'forum/fetchTopicById',
    async (
      topicId: number,
      { rejectWithValue }
    ) => {
      try {
        return await forumApi.getTopic(topicId)
      } catch (error) {
        return rejectWithValue(
          error instanceof Error
            ? error.message
            : 'Ошибка загрузки топика'
        )
      }
    }
  )

export const createTopicThunk = createAsyncThunk(
  'forum/createTopic',
  async (
    payload: CreateTopicPayload,
    { rejectWithValue }
  ) => {
    try {
      return await forumApi.createTopic(payload)
    } catch (error) {
      return rejectWithValue(
        error instanceof Error
          ? error.message
          : 'Ошибка создания топика'
      )
    }
  }
)

export const createCommentThunk =
  createAsyncThunk(
    'forum/createComment',
    async (
      payload: CreateCommentPayload,
      { rejectWithValue }
    ) => {
      try {
        return await forumApi.createComment(
          payload
        )
      } catch (error) {
        return rejectWithValue(
          error instanceof Error
            ? error.message
            : 'Ошибка добавления комментария'
        )
      }
    }
  )

export const forumSlice = createSlice({
  name: 'forum',
  initialState,
  reducers: {
    clearForumError: state => {
      state.error = null
    },
  },
  extraReducers: builder => {
    builder
      // fetchTopicsThunk
      .addCase(
        fetchTopicsThunk.pending,
        state => {
          state.isLoading = true
          state.error = null
        }
      )
      .addCase(
        fetchTopicsThunk.fulfilled,
        (
          state,
          action: PayloadAction<ForumTopic[]>
        ) => {
          state.topics = action.payload
          state.isLoading = false
        }
      )
      .addCase(
        fetchTopicsThunk.rejected,
        (state, action) => {
          state.isLoading = false
          state.error =
            (action.payload as string) ||
            'Ошибка загрузки топиков'
        }
      )

      // fetchTopicByIdThunk
      .addCase(
        fetchTopicByIdThunk.pending,
        state => {
          state.isLoading = true
          state.currentTopic = null
          state.comments = []
          state.error = null
        }
      )
      .addCase(
        fetchTopicByIdThunk.fulfilled,
        (
          state,
          action: PayloadAction<{
            topic: ForumTopic
            comments: ForumComment[]
          }>
        ) => {
          state.currentTopic =
            action.payload.topic
          state.comments = action.payload.comments
          state.isLoading = false
        }
      )
      .addCase(
        fetchTopicByIdThunk.rejected,
        (state, action) => {
          state.isLoading = false
          state.error =
            (action.payload as string) ||
            'Ошибка загрузки топика'
        }
      )

      // createTopicThunk
      .addCase(
        createTopicThunk.fulfilled,
        (
          state,
          action: PayloadAction<ForumTopic>
        ) => {
          state.topics = [
            action.payload,
            ...state.topics,
          ]
        }
      )

      // createCommentThunk
      .addCase(
        createCommentThunk.fulfilled,
        (
          state,
          action: PayloadAction<ForumComment>
        ) => {
          state.comments = [
            ...state.comments,
            action.payload,
          ]
          if (
            state.currentTopic &&
            state.currentTopic.id ===
              action.payload.topicId
          ) {
            state.currentTopic.commentsCount += 1
          }
        }
      )
  },
})

export const { clearForumError } =
  forumSlice.actions

export const selectTopics = (state: RootState) =>
  state.forum.topics
export const selectCurrentTopic = (
  state: RootState
) => state.forum.currentTopic
export const selectComments = (
  state: RootState
) => state.forum.comments
export const selectIsLoadingForum = (
  state: RootState
) => state.forum.isLoading
export const selectForumError = (
  state: RootState
) => state.forum.error

export default forumSlice.reducer
