import {
  describe,
  it,
  expect,
  jest,
  afterEach,
} from '@jest/globals'
import {
  createAppStore,
  type RootState,
} from '../store'
import { toggleCommentReactionThunk } from './forumSlice'
import type { ForumState } from './forumSlice'
import {
  forumDeleteCommentReaction,
  forumGetCommentReactions,
  forumPostCommentReaction,
} from '../shared/api/forumApi'

jest.mock('../shared/api/forumApi', () => ({
  forumDeleteCommentReaction: jest.fn(),
  forumGetCommentReactions: jest.fn(),
  forumPostCommentReaction: jest.fn(),
}))

const forumDeleteMock =
  forumDeleteCommentReaction as jest.MockedFunction<
    typeof forumDeleteCommentReaction
  >
const forumGetMock =
  forumGetCommentReactions as jest.MockedFunction<
    typeof forumGetCommentReactions
  >
const forumPostMock =
  forumPostCommentReaction as jest.MockedFunction<
    typeof forumPostCommentReaction
  >

function storeWithForum(
  forum: Partial<ForumState>
) {
  const base = createAppStore().getState()
  return createAppStore({
    ...base,
    forum: { ...base.forum, ...forum },
  } as RootState)
}

describe('toggleCommentReactionThunk', () => {
  afterEach(() => {
    jest.clearAllMocks()
  })

  it('posts reaction when mine is false and updates store', async () => {
    forumPostMock.mockResolvedValue(undefined)
    forumGetMock.mockResolvedValue({
      items: [
        { emoji: '👍', count: 1, mine: true },
      ],
    })

    const store = storeWithForum({
      reactionsByCommentId: {
        5: [
          { emoji: '👍', count: 0, mine: false },
        ],
      },
    })

    const action = await store.dispatch(
      toggleCommentReactionThunk({
        topicId: 1,
        commentId: 5,
        emoji: '👍',
      })
    )

    expect(
      toggleCommentReactionThunk.fulfilled.match(
        action
      )
    ).toBe(true)
    expect(forumPostMock).toHaveBeenCalledWith(
      5,
      '👍'
    )
    expect(forumDeleteMock).not.toHaveBeenCalled()
    expect(
      store.getState().forum
        .reactionsByCommentId[5]
    ).toEqual([
      { emoji: '👍', count: 1, mine: true },
    ])
  })

  it('deletes reaction when mine is true and refreshes aggregates', async () => {
    forumDeleteMock.mockResolvedValue(undefined)
    forumGetMock.mockResolvedValue({
      items: [],
    })

    const store = storeWithForum({
      reactionsByCommentId: {
        7: [
          { emoji: '🔥', count: 1, mine: true },
        ],
      },
    })

    await store.dispatch(
      toggleCommentReactionThunk({
        topicId: 2,
        commentId: 7,
        emoji: '🔥',
      })
    )

    expect(forumDeleteMock).toHaveBeenCalledWith(
      7,
      '🔥'
    )
    expect(forumPostMock).not.toHaveBeenCalled()
    expect(
      store.getState().forum
        .reactionsByCommentId[7]
    ).toEqual([])
  })
})
