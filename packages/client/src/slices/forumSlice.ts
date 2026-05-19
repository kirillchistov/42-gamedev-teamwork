import {
  createAsyncThunk,
  createSlice,
  isRejectedWithValue,
  type PayloadAction,
} from '@reduxjs/toolkit'
import type { AnyAction } from 'redux'
import { RootState } from '../store'
import {
  forumCreateComment,
  forumCreateTopic,
  forumDeleteComment,
  forumDeleteCommentReaction,
  forumDeleteTopic,
  forumFetchReactionsMap,
  forumGetAllComments,
  forumGetCommentReactions,
  forumGetTopic,
  forumGetTopics,
  forumPatchComment,
  forumPatchTopic,
  forumPostCommentReaction,
  ForumApiError,
} from '../shared/api/forumApi'
import type {
  ForumTopic,
  ForumComment,
  ForumReactionAgg,
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
  reactionsByCommentId: Record<
    number,
    ForumReactionAgg[]
  >
  isLoading: boolean
  shouldRedirectToLogin: boolean
}

const initialState: ForumState = {
  topics: [],
  currentTopic: null,
  comments: [],
  reactionsByCommentId: {},
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
      reactionsByCommentId: Record<
        number,
        ForumReactionAgg[]
      >
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
        const reactionsByCommentId =
          await forumFetchReactionsMap(
            topicId,
            comments
          )
        return {
          topic,
          comments,
          reactionsByCommentId,
        }
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

export const toggleCommentReactionThunk =
  createAsyncThunk<
    {
      commentId: number
      items: ForumReactionAgg[]
    },
    {
      topicId: number
      commentId: number
      emoji: string
    },
    {
      rejectValue: ForumRejectPayload
      state: RootState
    }
  >(
    'forum/toggleCommentReaction',
    async (
      { topicId, commentId, emoji },
      { rejectWithValue, getState }
    ) => {
      try {
        const rows: ForumReactionAgg[] =
          getState().forum.reactionsByCommentId[
            commentId
          ] ?? []
        const mine = rows.find(
          r => r.emoji === emoji
        )?.mine
        if (mine) {
          await forumDeleteCommentReaction(
            commentId,
            emoji
          )
        } else {
          await forumPostCommentReaction(
            commentId,
            emoji
          )
        }
        const fresh =
          await forumGetCommentReactions(
            topicId,
            commentId
          )
        return {
          commentId,
          items: fresh.items,
        }
      } catch (e) {
        return rejectWithValue(
          rejectFromUnknown(e)
        )
      }
    }
  )

export const updateTopicThunk = createAsyncThunk<
  ForumTopic,
  {
    topicId: number
    title?: string
    content?: string
  },
  { rejectValue: ForumRejectPayload }
>(
  'forum/updateTopic',
  async (
    { topicId, title, content },
    { rejectWithValue }
  ) => {
    try {
      return await forumPatchTopic(topicId, {
        title,
        content,
      })
    } catch (e) {
      return rejectWithValue(rejectFromUnknown(e))
    }
  }
)

export const deleteTopicThunk = createAsyncThunk<
  number,
  number,
  { rejectValue: ForumRejectPayload }
>(
  'forum/deleteTopic',
  async (topicId, { rejectWithValue }) => {
    try {
      await forumDeleteTopic(topicId)
      return topicId
    } catch (e) {
      return rejectWithValue(rejectFromUnknown(e))
    }
  }
)

export const updateCommentThunk =
  createAsyncThunk<
    ForumComment,
    { commentId: number; content: string },
    { rejectValue: ForumRejectPayload }
  >(
    'forum/updateComment',
    async (
      { commentId, content },
      { rejectWithValue }
    ) => {
      try {
        return await forumPatchComment(
          commentId,
          {
            content,
          }
        )
      } catch (e) {
        return rejectWithValue(
          rejectFromUnknown(e)
        )
      }
    }
  )

export const deleteCommentThunk =
  createAsyncThunk<
    {
      topic: ForumTopic
      comments: ForumComment[]
      reactionsByCommentId: Record<
        number,
        ForumReactionAgg[]
      >
    },
    { topicId: number; commentId: number },
    { rejectValue: ForumRejectPayload }
  >(
    'forum/deleteComment',
    async (
      { topicId, commentId },
      { rejectWithValue }
    ) => {
      try {
        await forumDeleteComment(commentId)
        const topic = await forumGetTopic(topicId)
        const comments =
          await forumGetAllComments(topicId)
        const reactionsByCommentId =
          await forumFetchReactionsMap(
            topicId,
            comments
          )
        return {
          topic,
          comments,
          reactionsByCommentId,
        }
      } catch (e) {
        return rejectWithValue(
          rejectFromUnknown(e)
        )
      }
    }
  )

function isForumRejectedWithValue(
  action: AnyAction
): action is AnyAction & {
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
          state.reactionsByCommentId = {}
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
            reactionsByCommentId: Record<
              number,
              ForumReactionAgg[]
            >
          }>
        ) => {
          state.currentTopic = payload.topic
          state.comments = payload.comments
          state.reactionsByCommentId =
            payload.reactionsByCommentId
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
          state.reactionsByCommentId[payload.id] =
            []
          if (
            state.currentTopic &&
            state.currentTopic.id ===
              payload.topicId
          ) {
            if (payload.parentCommentId != null) {
              state.currentTopic.repliesCount += 1
            } else {
              state.currentTopic.commentsCount += 1
            }
          }
          const topicInList = state.topics.find(
            t => t.id === payload.topicId
          )
          if (topicInList) {
            if (payload.parentCommentId != null) {
              topicInList.repliesCount += 1
            } else {
              topicInList.commentsCount += 1
            }
          }
        }
      )

      .addCase(
        toggleCommentReactionThunk.fulfilled.type,
        (
          state,
          {
            payload,
          }: PayloadAction<{
            commentId: number
            items: ForumReactionAgg[]
          }>
        ) => {
          state.reactionsByCommentId[
            payload.commentId
          ] = payload.items
        }
      )

      .addCase(
        updateTopicThunk.fulfilled.type,
        (
          state,
          { payload }: PayloadAction<ForumTopic>
        ) => {
          state.currentTopic = payload
          const idx = state.topics.findIndex(
            t => t.id === payload.id
          )
          if (idx >= 0) {
            state.topics[idx] = payload
          }
        }
      )

      .addCase(
        deleteTopicThunk.fulfilled.type,
        (
          state,
          { payload }: PayloadAction<number>
        ) => {
          state.topics = state.topics.filter(
            t => t.id !== payload
          )
          if (
            state.currentTopic?.id === payload
          ) {
            state.currentTopic = null
            state.comments = []
            state.reactionsByCommentId = {}
          }
        }
      )

      .addCase(
        updateCommentThunk.fulfilled.type,
        (
          state,
          { payload }: PayloadAction<ForumComment>
        ) => {
          state.comments = state.comments.map(c =>
            c.id === payload.id ? payload : c
          )
        }
      )

      .addCase(
        deleteCommentThunk.fulfilled.type,
        (
          state,
          {
            payload,
          }: PayloadAction<{
            topic: ForumTopic
            comments: ForumComment[]
            reactionsByCommentId: Record<
              number,
              ForumReactionAgg[]
            >
          }>
        ) => {
          state.currentTopic = payload.topic
          state.comments = payload.comments
          state.reactionsByCommentId =
            payload.reactionsByCommentId
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

      .addCase(
        toggleCommentReactionThunk.fulfilled.type,
        (
          state,
          {
            payload,
          }: PayloadAction<{
            commentId: number
            items: ForumReactionAgg[]
          }>
        ) => {
          state.reactionsByCommentId[
            payload.commentId
          ] = payload.items
        }
      )

      .addCase(
        updateTopicThunk.fulfilled.type,
        (
          state,
          { payload }: PayloadAction<ForumTopic>
        ) => {
          state.currentTopic = payload
          const idx = state.topics.findIndex(
            t => t.id === payload.id
          )
          if (idx >= 0) {
            state.topics[idx] = payload
          }
        }
      )

      .addCase(
        deleteTopicThunk.fulfilled.type,
        (
          state,
          { payload }: PayloadAction<number>
        ) => {
          state.topics = state.topics.filter(
            t => t.id !== payload
          )
          if (
            state.currentTopic?.id === payload
          ) {
            state.currentTopic = null
            state.comments = []
            state.reactionsByCommentId = {}
          }
        }
      )

      .addCase(
        updateCommentThunk.fulfilled.type,
        (
          state,
          { payload }: PayloadAction<ForumComment>
        ) => {
          state.comments = state.comments.map(c =>
            c.id === payload.id ? payload : c
          )
        }
      )

      .addCase(
        deleteCommentThunk.fulfilled.type,
        (
          state,
          {
            payload,
          }: PayloadAction<{
            topic: ForumTopic
            comments: ForumComment[]
            reactionsByCommentId: Record<
              number,
              ForumReactionAgg[]
            >
          }>
        ) => {
          state.currentTopic = payload.topic
          state.comments = payload.comments
          state.reactionsByCommentId =
            payload.reactionsByCommentId
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
export const selectForumReactionsByCommentId = (
  state: RootState
) => state.forum.reactionsByCommentId
export const selectIsLoadingForum = (
  state: RootState
) => state.forum.isLoading
export const selectForumShouldRedirectToLogin = (
  state: RootState
) => state.forum.shouldRedirectToLogin

export default forumSlice.reducer
