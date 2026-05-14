import { Router } from 'express'
import {
  col,
  fn,
  Op,
  ValidationError,
} from 'sequelize'
import { Comment, Topic } from '../models'

const router = Router()

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

function topicPayload(
  row: Topic,
  commentsCount: number
) {
  return {
    id: row.id,
    title: row.title,
    author: row.authorDisplay,
    createdAt: row.createdAt.toISOString(),
    content: row.content,
    commentsCount,
  }
}

function commentPayload(row: Comment) {
  return {
    id: row.id,
    topicId: row.topicId,
    author: row.authorDisplay,
    content: row.content,
    createdAt: row.createdAt.toISOString(),
    parentCommentId: row.parentId,
  }
}

async function commentCountsForTopicIds(
  ids: number[]
): Promise<Map<number, number>> {
  const map = new Map<number, number>()
  if (ids.length === 0) {
    return map
  }
  const rows = await Comment.findAll({
    attributes: [
      'topicId',
      [fn('COUNT', col('Comment.id')), 'cnt'],
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
      cnt: string
    }
    map.set(rec.topicId, Number(rec.cnt) || 0)
  }
  return map
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
    const countMap =
      await commentCountsForTopicIds(ids)

    res.json(
      rows.map(t =>
        topicPayload(t, countMap.get(t.id) ?? 0)
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

      const commentsCount = await Comment.count({
        where: { topicId },
      })

      res.json(topicPayload(topic, commentsCount))
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

    const topic = await Topic.create({
      title,
      content,
      authorPraktikumId: user.id,
      authorDisplay: user.displayLabel,
    })

    res.status(201).json(topicPayload(topic, 0))
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
        content,
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

export { router as forumRouter }
