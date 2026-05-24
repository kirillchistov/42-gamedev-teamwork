import request from 'supertest'
import { UniqueConstraintError } from 'sequelize'
import { createApp } from '../createApp'
import {
  Comment,
  CommentReaction,
  Topic,
} from '../models'

jest.mock('../models', () => ({
  Topic: { findByPk: jest.fn() },
  Comment: {
    findOne: jest.fn(),
    findByPk: jest.fn(),
  },
  CommentReaction: {
    findAll: jest.fn(),
    create: jest.fn(),
    findOne: jest.fn(),
    destroy: jest.fn(),
  },
}))

const TopicMock = Topic as jest.Mocked<
  typeof Topic
>
const CommentMock = Comment as jest.Mocked<
  typeof Comment
>
const CommentReactionMock =
  CommentReaction as jest.Mocked<
    typeof CommentReaction
  >

describe('forum comment reactions (HTTP, mocked DB)', () => {
  const envStore: Record<
    string,
    string | undefined
  > = {}

  beforeEach(() => {
    envStore.NODE_ENV = process.env.NODE_ENV
    envStore.LOCAL_PRAKTIKUM_AUTH_BYPASS =
      process.env.LOCAL_PRAKTIKUM_AUTH_BYPASS
    envStore.LOCAL_PRAKTIKUM_USER_ID =
      process.env.LOCAL_PRAKTIKUM_USER_ID

    process.env.NODE_ENV = 'test'
    process.env.LOCAL_PRAKTIKUM_AUTH_BYPASS = '1'
    process.env.LOCAL_PRAKTIKUM_USER_ID = '42'

    jest.clearAllMocks()
  })

  afterEach(() => {
    for (const k of Object.keys(envStore)) {
      const v = envStore[k]
      if (v === undefined) {
        delete process.env[k]
      } else {
        process.env[k] = v
      }
    }
  })

  const topicId = 1
  const commentId = 10

  function stubCommentExists() {
    TopicMock.findByPk.mockResolvedValue({
      id: topicId,
    } as Topic)
    CommentMock.findOne.mockResolvedValue({
      id: commentId,
      topicId,
    } as Comment)
    CommentMock.findByPk.mockResolvedValue({
      id: commentId,
      topicId,
    } as Comment)
  }

  it('GET reactions returns aggregated items with mine flag', async () => {
    stubCommentExists()
    CommentReactionMock.findAll.mockResolvedValue(
      [
        {
          emoji: '👍',
          authorPraktikumId: 42,
        },
        {
          emoji: '👍',
          authorPraktikumId: 7,
        },
      ] as CommentReaction[]
    )

    const app = createApp()
    const res = await request(app).get(
      `/api/forum/topics/${topicId}/comments/${commentId}/reactions`
    )

    expect(res.status).toBe(200)
    expect(res.body).toEqual({
      items: [
        { emoji: '👍', count: 2, mine: true },
      ],
    })
  })

  it('POST reaction creates row and returns 201', async () => {
    CommentMock.findByPk.mockResolvedValue({
      id: commentId,
    } as Comment)
    CommentReactionMock.create.mockResolvedValue({
      id: 1,
      commentId,
      authorPraktikumId: 42,
      emoji: '🔥',
      createdAt: new Date('2026-05-17T12:00:00Z'),
    } as CommentReaction)

    const app = createApp()
    const res = await request(app)
      .post(
        `/api/forum/comments/${commentId}/reactions`
      )
      .send({ emoji: '🔥' })

    expect(res.status).toBe(201)
    expect(res.body).toMatchObject({
      commentId,
      emoji: '🔥',
    })
    expect(
      CommentReactionMock.create
    ).toHaveBeenCalledWith({
      commentId,
      authorPraktikumId: 42,
      emoji: '🔥',
    })
  })

  it('POST reaction rejects emoji outside whitelist', async () => {
    CommentMock.findByPk.mockResolvedValue({
      id: commentId,
    } as Comment)

    const app = createApp()
    const res = await request(app)
      .post(
        `/api/forum/comments/${commentId}/reactions`
      )
      .send({ emoji: '💀' })

    expect(res.status).toBe(400)
    expect(res.body).toEqual({
      reason: 'Invalid emoji',
    })
    expect(
      CommentReactionMock.create
    ).not.toHaveBeenCalled()
  })

  it('POST duplicate reaction returns 200 with existing row', async () => {
    CommentMock.findByPk.mockResolvedValue({
      id: commentId,
    } as Comment)
    const existing = {
      id: 2,
      commentId,
      authorPraktikumId: 42,
      emoji: '⭐',
      createdAt: new Date('2026-05-17T12:00:00Z'),
    } as CommentReaction
    CommentReactionMock.create.mockRejectedValue(
      new UniqueConstraintError({})
    )
    CommentReactionMock.findOne.mockResolvedValue(
      existing
    )

    const app = createApp()
    const res = await request(app)
      .post(
        `/api/forum/comments/${commentId}/reactions`
      )
      .send({ emoji: '⭐' })

    expect(res.status).toBe(200)
    expect(res.body).toMatchObject({
      commentId,
      emoji: '⭐',
    })
  })

  it('DELETE reaction returns 204 when row removed', async () => {
    CommentReactionMock.destroy.mockResolvedValue(
      1
    )

    const app = createApp()
    const res = await request(app).delete(
      `/api/forum/comments/${commentId}/reactions/${encodeURIComponent(
        '❤️'
      )}`
    )

    expect(res.status).toBe(204)
    expect(
      CommentReactionMock.destroy
    ).toHaveBeenCalledWith({
      where: {
        commentId,
        authorPraktikumId: 42,
        emoji: '❤️',
      },
    })
  })

  it('DELETE reaction returns 404 when nothing deleted', async () => {
    CommentReactionMock.destroy.mockResolvedValue(
      0
    )

    const app = createApp()
    const res = await request(app).delete(
      `/api/forum/comments/${commentId}/reactions/${encodeURIComponent(
        '🚀'
      )}`
    )

    expect(res.status).toBe(404)
    expect(res.body).toEqual({
      reason: 'Not found',
    })
  })
})
