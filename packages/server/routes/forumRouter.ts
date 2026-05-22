import type { Request, Response } from 'express'
import { Router } from 'express'
import type { PraktikumUser } from '../middleware/praktikumUser'
import {
  fn,
  literal,
  Op,
  UniqueConstraintError,
  ValidationError,
} from 'sequelize'
import {
  Comment,
  CommentReaction,
  Topic,
} from '../models'
import {
  canForumAuthorOrModerator,
  isForumModeratorUser,
} from './forumAccess'
import { isAllowedForumReactionEmoji } from './forumEmojiGuard'
import {
  validateForumContent,
  validateForumTitle,
} from '../utils/plainTextContent'

const router = Router()

function rejectPlainText(
  res: Response,
  reason: string
): void {
  res.status(400).json({ reason })
}

function requireSessionUser(
  req: Request,
  res: Response
): PraktikumUser | null {
  const user = req.praktikumUser
  if (!user) {
    res.status(403).json({ reason: 'Forbidden' })
    return null
  }
  return user
}

function reactionRowPayload(
  row: CommentReaction
) {
  return {
    id: row.id,
    commentId: row.commentId,
    emoji: row.emoji,
    createdAt: row.createdAt.toISOString(),
  }
}

function parseLimitParam(
  raw: unknown,
  fallback: number,
  max: number
): number {
  const n = Number(raw)
  if (!Number.isFinite(n) || n < 1) {
    return fallback
  }
  return Math.min(max, Math.floor(n))
}

function parseOffsetParam(raw: unknown): number {
  const n = Number(raw)
  if (!Number.isFinite(n) || n < 0) {
    return 0
  }
  return Math.floor(n)
}

type TopicCommentStats = {
  commentsCount: number
  repliesCount: number
}

const EMPTY_TOPIC_COMMENT_STATS: TopicCommentStats =
  {
    commentsCount: 0,
    repliesCount: 0,
  }

function topicPayload(
  row: Topic,
  stats: TopicCommentStats,
  req: Request
) {
  const user = req.praktikumUser
  const viewerIsModerator =
    user != null && isForumModeratorUser(user.id)
  return {
    id: row.id,
    title: row.title,
    author: row.authorDisplay,
    authorPraktikumId: row.authorPraktikumId,
    createdAt: row.createdAt.toISOString(),
    content: row.content,
    commentsCount: stats.commentsCount,
    repliesCount: stats.repliesCount,
    viewerIsModerator,
  }
}

function commentPayload(row: Comment) {
  return {
    id: row.id,
    topicId: row.topicId,
    author: row.authorDisplay,
    authorPraktikumId: row.authorPraktikumId,
    content: row.content,
    createdAt: row.createdAt.toISOString(),
    parentCommentId: row.parentId,
  }
}

async function commentStatsForTopicIds(
  ids: number[]
): Promise<Map<number, TopicCommentStats>> {
  const map = new Map<number, TopicCommentStats>()
  if (ids.length === 0) {
    return map
  }
  const rows = await Comment.findAll({
    attributes: [
      'topicId',
      [
        fn(
          'SUM',
          literal(
            'CASE WHEN parent_id IS NULL THEN 1 ELSE 0 END'
          )
        ),
        'commentsCount',
      ],
      [
        fn(
          'SUM',
          literal(
            'CASE WHEN parent_id IS NOT NULL THEN 1 ELSE 0 END'
          )
        ),
        'repliesCount',
      ],
    ],
    where: {
      topicId: { [Op.in]: ids },
    },
    group: ['topicId'],
    raw: true,
  })
  for (const r of rows) {
    const rec = r as unknown as {
      topicId: number
      commentsCount: string
      repliesCount: string
    }
    map.set(rec.topicId, {
      commentsCount:
        Number(rec.commentsCount) || 0,
      repliesCount: Number(rec.repliesCount) || 0,
    })
  }
  return map
}

async function commentStatsForTopic(
  topicId: number
): Promise<TopicCommentStats> {
  const [commentsCount, repliesCount] =
    await Promise.all([
      Comment.count({
        where: { topicId, parentId: null },
      }),
      Comment.count({
        where: {
          topicId,
          parentId: { [Op.ne]: null },
        },
      }),
    ])
  return { commentsCount, repliesCount }
}

/** GET /topics — список (limit default 20; offset или page). */
router.get('/topics', async (req, res) => {
  try {
    const limit = parseLimitParam(
      req.query.limit,
      20,
      100
    )
    let offset = parseOffsetParam(
      req.query.offset
    )
    const pageRaw = req.query.page
    const pageNum = Number(pageRaw)
    if (
      pageRaw !== undefined &&
      pageRaw !== '' &&
      Number.isFinite(pageNum) &&
      pageNum >= 1
    ) {
      offset = Math.floor(pageNum - 1) * limit
    }

    const rows = await Topic.findAll({
      order: [['createdAt', 'DESC']],
      limit,
      offset,
    })

    const ids = rows.map(t => t.id)
    const statsMap =
      await commentStatsForTopicIds(ids)

    res.json(
      rows.map(t =>
        topicPayload(
          t,
          statsMap.get(t.id) ??
            EMPTY_TOPIC_COMMENT_STATS,
          req
        )
      )
    )
  } catch {
    res
      .status(500)
      .json({ reason: 'Internal error' })
  }
})

/** GET /topics/:topicId */
router.get(
  '/topics/:topicId',
  async (req, res) => {
    try {
      const topicId = Number(req.params.topicId)
      if (!Number.isFinite(topicId)) {
        res
          .status(404)
          .json({ reason: 'Not found' })
        return
      }

      const topic = await Topic.findByPk(topicId)
      if (!topic) {
        res
          .status(404)
          .json({ reason: 'Not found' })
        return
      }

      const stats = await commentStatsForTopic(
        topicId
      )

      res.json(topicPayload(topic, stats, req))
    } catch {
      res
        .status(500)
        .json({ reason: 'Internal error' })
    }
  }
)

/** POST /topics */
router.post('/topics', async (req, res) => {
  const user = req.praktikumUser
  if (!user) {
    res.status(403).json({ reason: 'Forbidden' })
    return
  }

  try {
    const body = req.body as unknown
    if (
      body === null ||
      typeof body !== 'object'
    ) {
      res
        .status(400)
        .json({ reason: 'Invalid body' })
      return
    }
    const o = body as Record<string, unknown>
    const title =
      typeof o.title === 'string' ? o.title : ''
    const content =
      typeof o.content === 'string'
        ? o.content
        : ''

    const titleCheck = validateForumTitle(title)
    if (!titleCheck.ok) {
      rejectPlainText(res, titleCheck.reason)
      return
    }
    const contentCheck =
      validateForumContent(content)
    if (!contentCheck.ok) {
      rejectPlainText(res, contentCheck.reason)
      return
    }

    const topic = await Topic.create({
      title: titleCheck.value,
      content: contentCheck.value,
      authorPraktikumId: user.id,
      authorDisplay: user.displayLabel,
    })

    res
      .status(201)
      .json(
        topicPayload(
          topic,
          EMPTY_TOPIC_COMMENT_STATS,
          req
        )
      )
  } catch (e) {
    if (e instanceof ValidationError) {
      res.status(400).json({
        reason: 'Validation failed',
      })
      return
    }
    if (process.env.NODE_ENV === 'development') {
      console.error(
        '[forum] POST /topics failed:',
        e
      )
    }
    res
      .status(500)
      .json({ reason: 'Internal error' })
  }
})

/** GET /topics/:topicId/comments */
router.get(
  '/topics/:topicId/comments',
  async (req, res) => {
    try {
      const topicId = Number(req.params.topicId)
      if (!Number.isFinite(topicId)) {
        res
          .status(404)
          .json({ reason: 'Not found' })
        return
      }

      const topic = await Topic.findByPk(topicId)
      if (!topic) {
        res
          .status(404)
          .json({ reason: 'Not found' })
        return
      }

      const limit = parseLimitParam(
        req.query.limit,
        50,
        100
      )
      const offset = parseOffsetParam(
        req.query.offset
      )

      const { rows, count } =
        await Comment.findAndCountAll({
          where: { topicId },
          order: [
            ['createdAt', 'ASC'],
            ['id', 'ASC'],
          ],
          limit,
          offset,
        })

      res.json({
        items: rows.map(commentPayload),
        total: count,
        limit,
        offset,
      })
    } catch {
      res
        .status(500)
        .json({ reason: 'Internal error' })
    }
  }
)

/** POST /topics/:topicId/comments */
router.post(
  '/topics/:topicId/comments',
  async (req, res) => {
    const user = req.praktikumUser
    if (!user) {
      res
        .status(403)
        .json({ reason: 'Forbidden' })
      return
    }

    try {
      const topicId = Number(req.params.topicId)
      if (!Number.isFinite(topicId)) {
        res
          .status(404)
          .json({ reason: 'Not found' })
        return
      }

      const topic = await Topic.findByPk(topicId)
      if (!topic) {
        res
          .status(404)
          .json({ reason: 'Not found' })
        return
      }

      const body = req.body as unknown
      if (
        body === null ||
        typeof body !== 'object'
      ) {
        res
          .status(400)
          .json({ reason: 'Invalid body' })
        return
      }
      const o = body as Record<string, unknown>
      const content =
        typeof o.content === 'string'
          ? o.content
          : ''
      const contentCheck =
        validateForumContent(content)
      if (!contentCheck.ok) {
        rejectPlainText(res, contentCheck.reason)
        return
      }
      const rawParent = o.parentCommentId
      const parentCommentId =
        rawParent === null ||
        rawParent === undefined
          ? null
          : Number(rawParent)
      if (
        parentCommentId !== null &&
        !Number.isFinite(parentCommentId)
      ) {
        res.status(400).json({
          reason: 'Invalid parentCommentId',
        })
        return
      }

      if (parentCommentId !== null) {
        const parent = await Comment.findOne({
          where: {
            id: parentCommentId,
            topicId,
          },
        })
        if (!parent) {
          res.status(400).json({
            reason: 'Invalid parentCommentId',
          })
          return
        }
      }

      const comment = await Comment.create({
        topicId,
        parentId: parentCommentId,
        authorPraktikumId: user.id,
        authorDisplay: user.displayLabel,
        content: contentCheck.value,
      })

      res
        .status(201)
        .json(commentPayload(comment))
    } catch (e) {
      if (e instanceof ValidationError) {
        res.status(400).json({
          reason: 'Validation failed',
        })
        return
      }
      res
        .status(500)
        .json({ reason: 'Internal error' })
    }
  }
)

/** GET /topics/:topicId/comments/:commentId/reactions */
router.get(
  '/topics/:topicId/comments/:commentId/reactions',
  async (req, res) => {
    try {
      const topicId = Number(req.params.topicId)
      const commentId = Number(
        req.params.commentId
      )
      if (
        !Number.isFinite(topicId) ||
        !Number.isFinite(commentId)
      ) {
        res
          .status(404)
          .json({ reason: 'Not found' })
        return
      }

      const topic = await Topic.findByPk(topicId)
      if (!topic) {
        res
          .status(404)
          .json({ reason: 'Not found' })
        return
      }

      const comment = await Comment.findOne({
        where: { id: commentId, topicId },
      })
      if (!comment) {
        res
          .status(404)
          .json({ reason: 'Not found' })
        return
      }

      const myId = req.praktikumUser?.id
      const rows = await CommentReaction.findAll({
        where: { commentId },
        attributes: [
          'emoji',
          'authorPraktikumId',
        ],
        order: [['emoji', 'ASC']],
      })

      const map = new Map<
        string,
        { count: number; mine: boolean }
      >()
      for (const r of rows) {
        const cur = map.get(r.emoji) ?? {
          count: 0,
          mine: false,
        }
        cur.count += 1
        if (
          myId !== undefined &&
          r.authorPraktikumId === myId
        ) {
          cur.mine = true
        }
        map.set(r.emoji, cur)
      }

      const items = [...map.entries()].map(
        ([emoji, v]) => ({
          emoji,
          count: v.count,
          mine: v.mine,
        })
      )

      res.json({ items })
    } catch {
      res
        .status(500)
        .json({ reason: 'Internal error' })
    }
  }
)

/** POST /comments/:commentId/reactions */
router.post(
  '/comments/:commentId/reactions',
  async (req, res) => {
    const user = requireSessionUser(req, res)
    if (!user) {
      return
    }

    try {
      const commentId = Number(
        req.params.commentId
      )
      if (!Number.isFinite(commentId)) {
        res
          .status(404)
          .json({ reason: 'Not found' })
        return
      }

      const comment = await Comment.findByPk(
        commentId
      )
      if (!comment) {
        res
          .status(404)
          .json({ reason: 'Not found' })
        return
      }

      const body = req.body as unknown
      if (
        body === null ||
        typeof body !== 'object'
      ) {
        res
          .status(400)
          .json({ reason: 'Invalid body' })
        return
      }
      const o = body as Record<string, unknown>
      const emoji =
        typeof o.emoji === 'string' ? o.emoji : ''
      if (!isAllowedForumReactionEmoji(emoji)) {
        res.status(400).json({
          reason: 'Invalid emoji',
        })
        return
      }

      try {
        const row = await CommentReaction.create({
          commentId,
          authorPraktikumId: user.id,
          emoji,
        })
        res
          .status(201)
          .json(reactionRowPayload(row))
      } catch (e) {
        if (e instanceof UniqueConstraintError) {
          const existing =
            await CommentReaction.findOne({
              where: {
                commentId,
                authorPraktikumId: user.id,
                emoji,
              },
            })
          if (existing) {
            res
              .status(200)
              .json(reactionRowPayload(existing))
            return
          }
        }
        if (e instanceof ValidationError) {
          res.status(400).json({
            reason: 'Validation failed',
          })
          return
        }
        throw e
      }
    } catch {
      res
        .status(500)
        .json({ reason: 'Internal error' })
    }
  }
)

/** DELETE /comments/:commentId/reactions/:emoji */
router.delete(
  '/comments/:commentId/reactions/:emoji',
  async (req, res) => {
    const user = requireSessionUser(req, res)
    if (!user) {
      return
    }

    try {
      const commentId = Number(
        req.params.commentId
      )
      const emoji = decodeURIComponent(
        String(req.params.emoji ?? '')
      )
      if (!Number.isFinite(commentId)) {
        res
          .status(404)
          .json({ reason: 'Not found' })
        return
      }
      if (!isAllowedForumReactionEmoji(emoji)) {
        res.status(400).json({
          reason: 'Invalid emoji',
        })
        return
      }

      const deleted =
        await CommentReaction.destroy({
          where: {
            commentId,
            authorPraktikumId: user.id,
            emoji,
          },
        })
      if (deleted === 0) {
        res
          .status(404)
          .json({ reason: 'Not found' })
        return
      }
      res.status(204).send()
    } catch {
      res
        .status(500)
        .json({ reason: 'Internal error' })
    }
  }
)

/** PATCH /topics/:topicId */
router.patch(
  '/topics/:topicId',
  async (req, res) => {
    const user = requireSessionUser(req, res)
    if (!user) {
      return
    }

    try {
      const topicId = Number(req.params.topicId)
      if (!Number.isFinite(topicId)) {
        res
          .status(404)
          .json({ reason: 'Not found' })
        return
      }

      const topic = await Topic.findByPk(topicId)
      if (!topic) {
        res
          .status(404)
          .json({ reason: 'Not found' })
        return
      }

      if (
        !canForumAuthorOrModerator(
          user.id,
          topic.authorPraktikumId
        )
      ) {
        res.status(403).json({
          reason: 'Not author or moderator',
        })
        return
      }

      const body = req.body as unknown
      if (
        body === null ||
        typeof body !== 'object'
      ) {
        res
          .status(400)
          .json({ reason: 'Invalid body' })
        return
      }
      const o = body as Record<string, unknown>
      const patch: {
        title?: string
        content?: string
      } = {}
      if (typeof o.title === 'string') {
        const titleCheck = validateForumTitle(
          o.title
        )
        if (!titleCheck.ok) {
          rejectPlainText(res, titleCheck.reason)
          return
        }
        patch.title = titleCheck.value
      }
      if (typeof o.content === 'string') {
        const contentCheck = validateForumContent(
          o.content
        )
        if (!contentCheck.ok) {
          rejectPlainText(
            res,
            contentCheck.reason
          )
          return
        }
        patch.content = contentCheck.value
      }
      if (Object.keys(patch).length === 0) {
        res.status(400).json({
          reason: 'Empty patch',
        })
        return
      }

      await topic.update(patch)
      await topic.reload()
      const stats = await commentStatsForTopic(
        topicId
      )
      res.json(topicPayload(topic, stats, req))
    } catch (e) {
      if (e instanceof ValidationError) {
        res.status(400).json({
          reason: 'Validation failed',
        })
        return
      }
      res
        .status(500)
        .json({ reason: 'Internal error' })
    }
  }
)

/** DELETE /topics/:topicId */
router.delete(
  '/topics/:topicId',
  async (req, res) => {
    const user = requireSessionUser(req, res)
    if (!user) {
      return
    }

    try {
      const topicId = Number(req.params.topicId)
      if (!Number.isFinite(topicId)) {
        res
          .status(404)
          .json({ reason: 'Not found' })
        return
      }

      const topic = await Topic.findByPk(topicId)
      if (!topic) {
        res
          .status(404)
          .json({ reason: 'Not found' })
        return
      }

      if (
        !canForumAuthorOrModerator(
          user.id,
          topic.authorPraktikumId
        )
      ) {
        res.status(403).json({
          reason: 'Not author or moderator',
        })
        return
      }

      await topic.destroy()
      res.status(204).send()
    } catch {
      res
        .status(500)
        .json({ reason: 'Internal error' })
    }
  }
)

/** PATCH /comments/:commentId */
router.patch(
  '/comments/:commentId',
  async (req, res) => {
    const user = requireSessionUser(req, res)
    if (!user) {
      return
    }

    try {
      const commentId = Number(
        req.params.commentId
      )
      if (!Number.isFinite(commentId)) {
        res
          .status(404)
          .json({ reason: 'Not found' })
        return
      }

      const comment = await Comment.findByPk(
        commentId
      )
      if (!comment) {
        res
          .status(404)
          .json({ reason: 'Not found' })
        return
      }

      if (
        !canForumAuthorOrModerator(
          user.id,
          comment.authorPraktikumId
        )
      ) {
        res.status(403).json({
          reason: 'Not author or moderator',
        })
        return
      }

      const body = req.body as unknown
      if (
        body === null ||
        typeof body !== 'object'
      ) {
        res
          .status(400)
          .json({ reason: 'Invalid body' })
        return
      }
      const o = body as Record<string, unknown>
      if (typeof o.content !== 'string') {
        res.status(400).json({
          reason: 'Invalid body',
        })
        return
      }

      const contentCheck = validateForumContent(
        o.content
      )
      if (!contentCheck.ok) {
        rejectPlainText(res, contentCheck.reason)
        return
      }

      await comment.update({
        content: contentCheck.value,
      })
      await comment.reload()
      res.json(commentPayload(comment))
    } catch (e) {
      if (e instanceof ValidationError) {
        res.status(400).json({
          reason: 'Validation failed',
        })
        return
      }
      res
        .status(500)
        .json({ reason: 'Internal error' })
    }
  }
)

/** DELETE /comments/:commentId */
router.delete(
  '/comments/:commentId',
  async (req, res) => {
    const user = requireSessionUser(req, res)
    if (!user) {
      return
    }

    try {
      const commentId = Number(
        req.params.commentId
      )
      if (!Number.isFinite(commentId)) {
        res
          .status(404)
          .json({ reason: 'Not found' })
        return
      }

      const comment = await Comment.findByPk(
        commentId
      )
      if (!comment) {
        res
          .status(404)
          .json({ reason: 'Not found' })
        return
      }

      if (
        !canForumAuthorOrModerator(
          user.id,
          comment.authorPraktikumId
        )
      ) {
        res.status(403).json({
          reason: 'Not author or moderator',
        })
        return
      }

      await comment.destroy()
      res.status(204).send()
    } catch {
      res
        .status(500)
        .json({ reason: 'Internal error' })
    }
  }
)

export { router as forumRouter }
