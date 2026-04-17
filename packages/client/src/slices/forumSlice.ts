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

const DEMO_TOPICS: ForumTopic[] = [
  {
    id: 1,
    title: 'Баланс уровней match-3',
    author: 'dev-1',
    createdAt: '2026-03-20T10:00:00Z',
    content:
      'Предлагаю обсудить текущий баланс уровней. На 15-м уровне слишком мало ходов для прохождения, а 20-й проходится за пару минут. Нужно выровнять сложность.',
    commentsCount: 3,
  },
  {
    id: 2,
    title: 'Идеи новых бомб',
    author: 'dev-3',
    createdAt: '2026-03-21T14:30:00Z',
    content:
      'Какие новые типы бомб можно добавить в игру? Сейчас есть линейная и радиальная. Может, добавить диагональную или бомбу-молнию?',
    commentsCount: 5,
  },
  {
    id: 3,
    title: 'Баги на мобильных устройствах',
    author: 'tester-1',
    createdAt: '2026-03-22T09:15:00Z',
    content:
      'Собираю список багов на мобильных: тач-события иногда не срабатывают, анимация подтормаживает на старых устройствах.',
    commentsCount: 2,
  },
  {
    id: 4,
    title: 'Космические темы для интерфейса',
    author: 'designer-1',
    createdAt: '2026-03-23T16:45:00Z',
    content:
      'Хочу предложить новые варианты оформления в космическом стиле: тема «Туманность», тема «Чёрная дыра» и тема «Сверхновая».',
    commentsCount: 1,
  },
]

const DEMO_COMMENTS: ForumComment[] = [
  {
    id: 1,
    topicId: 1,
    author: 'dev-2',
    content:
      'Согласен, 15-й уровень слишком сложный. Добавить бы пару ходов.',
    createdAt: '2026-03-20T11:00:00Z',
    parentCommentId: null,
  },
  {
    id: 2,
    topicId: 1,
    author: 'dev-1',
    content:
      'Или можно добавить бонусный ход за комбо из 5 элементов.',
    createdAt: '2026-03-20T11:30:00Z',
    parentCommentId: 1,
  },
  {
    id: 3,
    topicId: 1,
    author: 'tester-1',
    content:
      'Протестировал — с 3 дополнительными ходами баланс ок 👍',
    createdAt: '2026-03-20T14:00:00Z',
    parentCommentId: null,
  },
  {
    id: 4,
    topicId: 2,
    author: 'dev-1',
    content:
      'Молния — отличная идея! Может очищать случайный ряд или столбец.',
    createdAt: '2026-03-21T15:00:00Z',
    parentCommentId: null,
  },
  {
    id: 5,
    topicId: 2,
    author: 'designer-1',
    content:
      'Нарисую концепт для молнии и диагональной бомбы 🎨',
    createdAt: '2026-03-21T15:30:00Z',
    parentCommentId: 4,
  },
  {
    id: 6,
    topicId: 3,
    author: 'dev-2',
    content:
      'Тач-события — известная проблема. Попробуй pointer events вместо touch.',
    createdAt: '2026-03-22T10:00:00Z',
    parentCommentId: null,
  },
  {
    id: 7,
    topicId: 4,
    author: 'dev-3',
    content:
      'Тема «Чёрная дыра» звучит круто! Тёмный фон с затягивающей анимацией 🌀',
    createdAt: '2026-03-23T17:00:00Z',
    parentCommentId: null,
  },
]

let demoTopics = [...DEMO_TOPICS]
let demoComments = [...DEMO_COMMENTS]
let nextTopicId = 100
let nextCommentId = 100

export interface ForumState {
  topics: ForumTopic[]
  currentTopic: ForumTopic | null
  comments: ForumComment[]
  isLoading: boolean
}

const initialState: ForumState = {
  topics: [],
  currentTopic: null,
  comments: [],
  isLoading: false,
}

export const fetchTopicsThunk = createAsyncThunk(
  'forum/fetchTopics',
  async () => {
    // Sprint 8: return fetch(`${SERVER_HOST}/api/forum/topics`).then(r => r.json())
    return Promise.resolve([...demoTopics])
  }
)

export const fetchTopicByIdThunk =
  createAsyncThunk(
    'forum/fetchTopicById',
    async (topicId: number) => {
      // Sprint 8: return fetch(`${SERVER_HOST}/api/forum/topics/${topicId}`).then(r => r.json())
      const topic =
        demoTopics.find(t => t.id === topicId) ||
        null
      const comments = demoComments.filter(
        c => c.topicId === topicId
      )
      return Promise.resolve({ topic, comments })
    }
  )

export const createTopicThunk = createAsyncThunk(
  'forum/createTopic',
  async (payload: CreateTopicPayload) => {
    // Sprint 8: return fetch(`${SERVER_HOST}/api/forum/topics`, { method: 'POST', body: JSON.stringify(payload) }).then(r => r.json())
    const newTopic: ForumTopic = {
      id: nextTopicId++,
      title: payload.title,
      content: payload.content,
      author: payload.author,
      createdAt: new Date().toISOString(),
      commentsCount: 0,
    }
    demoTopics = [newTopic, ...demoTopics]
    return Promise.resolve(newTopic)
  }
)

export const createCommentThunk =
  createAsyncThunk(
    'forum/createComment',
    async (payload: CreateCommentPayload) => {
      // Sprint 8: return fetch(`${SERVER_HOST}/api/forum/comments`, { method: 'POST', body: JSON.stringify(payload) }).then(r => r.json())
      const newComment: ForumComment = {
        id: nextCommentId++,
        topicId: payload.topicId,
        author: payload.author,
        content: payload.content,
        createdAt: new Date().toISOString(),
        parentCommentId:
          payload.parentCommentId ?? null,
      }
      demoComments = [...demoComments, newComment]
      const topic = demoTopics.find(
        t => t.id === payload.topicId
      )
      if (topic) {
        topic.commentsCount += 1
      }
      return Promise.resolve(newComment)
    }
  )

export const forumSlice = createSlice({
  name: 'forum',
  initialState,
  reducers: {},
  extraReducers: builder => {
    builder
      .addCase(
        fetchTopicsThunk.pending.type,
        state => {
          state.isLoading = true
        }
      )
      .addCase(
        fetchTopicsThunk.fulfilled.type,
        (
          state,
          { payload }: PayloadAction<ForumTopic[]>
        ) => {
          state.topics = payload
          state.isLoading = false
        }
      )
      .addCase(
        fetchTopicsThunk.rejected.type,
        state => {
          state.isLoading = false
        }
      )

      .addCase(
        fetchTopicByIdThunk.pending.type,
        state => {
          state.isLoading = true
          state.currentTopic = null
          state.comments = []
        }
      )
      .addCase(
        fetchTopicByIdThunk.fulfilled.type,
        (
          state,
          {
            payload,
          }: PayloadAction<{
            topic: ForumTopic | null
            comments: ForumComment[]
          }>
        ) => {
          state.currentTopic = payload.topic
          state.comments = payload.comments
          state.isLoading = false
        }
      )
      .addCase(
        fetchTopicByIdThunk.rejected.type,
        state => {
          state.isLoading = false
        }
      )

      .addCase(
        createTopicThunk.fulfilled.type,
        (
          state,
          { payload }: PayloadAction<ForumTopic>
        ) => {
          state.topics = [
            payload,
            ...state.topics,
          ]
        }
      )

      .addCase(
        createCommentThunk.fulfilled.type,
        (
          state,
          { payload }: PayloadAction<ForumComment>
        ) => {
          state.comments = [
            ...state.comments,
            payload,
          ]
          if (
            state.currentTopic &&
            state.currentTopic.id ===
              payload.topicId
          ) {
            state.currentTopic.commentsCount += 1
          }
        }
      )
  },
})

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

export default forumSlice.reducer
