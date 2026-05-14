import {
  createAsyncThunk,
  createSlice,
  isRejectedWithValue,
  type PayloadAction,
} from '@reduxjs/toolkit'
import type { UnknownAction } from '@reduxjs/toolkit'
import { RootState } from '../store'
import {
  forumCreateComment,
  forumCreateTopic,
  forumGetAllComments,
  forumGetTopic,
  forumGetTopics,
  ForumApiError,
} from '../shared/api/forumApi'
import type {
  ForumTopic,
  ForumComment,
  CreateTopicPayload,
  CreateCommentPayload,
} from '../types/forum'

export type ForumRejectPayload = {
  status: number
  message: string
}

function rejectFromUnknown(
  e: unknown
): ForumRejectPayload {
  if (e instanceof ForumApiError) {
    return {
      status: e.status,
      message: e.message,
    }
  }
  if (e instanceof Error) {
    return { status: 500, message: e.message }
  }
  return {
    status: 500,
    message: 'Неизвестная ошибка',
  }
}

export interface ForumState {
  topics: ForumTopic[]
  currentTopic: ForumTopic | null
  comments: ForumComment[]
  isLoading: boolean
  /** 403 от API форума — клиент делает редирект на /login */
  shouldRedirectToLogin: boolean
}

const initialState: ForumState = {
  topics: [],
  currentTopic: null,
  comments: [],
  isLoading: false,
  shouldRedirectToLogin: false,
}

export const fetchTopicsThunk = createAsyncThunk<
  ForumTopic[],
  void,
  { rejectValue: ForumRejectPayload }
>(
  'forum/fetchTopics',
  async (_, { rejectWithValue }) => {
    try {
      return await forumGetTopics()
    } catch (e) {
      return rejectWithValue(rejectFromUnknown(e))
    }
  }
)

export const fetchTopicByIdThunk =
  createAsyncThunk<
    {
      topic: ForumTopic
      comments: ForumComment[]
    },
    number,
    { rejectValue: ForumRejectPayload }
  >(
    'forum/fetchTopicById',
    async (topicId, { rejectWithValue }) => {
      try {
        const topic = await forumGetTopic(topicId)
        const comments =
          await forumGetAllComments(topicId)
        return { topic, comments }
      } catch (e) {
        return rejectWithValue(
          rejectFromUnknown(e)
        )
      }
    }
  )

export const createTopicThunk = createAsyncThunk<
  ForumTopic,
  CreateTopicPayload,
  { rejectValue: ForumRejectPayload }
>(
  'forum/createTopic',
  async (payload, { rejectWithValue }) => {
    try {
      return await forumCreateTopic({
        title: payload.title,
        content: payload.content,
      })
    } catch (e) {
      return rejectWithValue(rejectFromUnknown(e))
    }
  }
)

export const createCommentThunk =
  createAsyncThunk<
    ForumComment,
    CreateCommentPayload,
    { rejectValue: ForumRejectPayload }
  >(
    'forum/createComment',
    async (payload, { rejectWithValue }) => {
      try {
        return await forumCreateComment(
          payload.topicId,
          {
            content: payload.content,
            parentCommentId:
              payload.parentCommentId ?? null,
          }
        )
      } catch (e) {
        return rejectWithValue(
          rejectFromUnknown(e)
        )
      }
    }
  )

function isForumRejectedWithValue(
  action: UnknownAction
): action is UnknownAction & {
  type: string
  payload: ForumRejectPayload
} {
  return (
    typeof action.type === 'string' &&
    action.type.startsWith('forum/') &&
    action.type.endsWith('/rejected') &&
    isRejectedWithValue(action)
  )
}

export const forumSlice = createSlice({
  name: 'forum',
  initialState,
  reducers: {
    clearForumAuthRedirect(state) {
      state.shouldRedirectToLogin = false
    },
  },
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
          state.shouldRedirectToLogin = false
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
            topic: ForumTopic
            comments: ForumComment[]
          }>
        ) => {
          state.currentTopic = payload.topic
          state.comments = payload.comments
          state.isLoading = false
          state.shouldRedirectToLogin = false
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

      .addMatcher(
        isForumRejectedWithValue,
        (state, action) => {
          state.isLoading = false
          if (action.payload.status === 403) {
            state.shouldRedirectToLogin = true
          }
        }
      )
  },
})

export const { clearForumAuthRedirect } =
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
export const selectForumShouldRedirectToLogin = (
  state: RootState
) => state.forum.shouldRedirectToLogin

export default forumSlice.reducer
