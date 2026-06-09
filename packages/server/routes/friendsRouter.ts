import { Router } from 'express'
import type { Request, Response } from 'express'
import { UniqueConstraintError } from 'sequelize'
import type { PraktikumUser } from '../middleware/praktikumUser'
import { UserFriend } from '../models/UserFriend'

const router = Router()

const MAX_FRIENDS = 100

export type FriendDto = {
  nickname: string
  displayName: string
  avatar: string | null
}

function requireSessionUser(req: Request, res: Response): PraktikumUser | null {
  const user = req.praktikumUser
  if (!user) {
    res.status(403).json({ reason: 'Forbidden' })
    return null
  }
  return user
}

function rowToDto(row: UserFriend): FriendDto {
  return {
    nickname: row.friendNickname,
    displayName: row.friendDisplayName || row.friendNickname,
    avatar: row.friendAvatar,
  }
}

function parseNickname(raw: unknown): string | null {
  if (typeof raw !== 'string') {
    return null
  }
  const nickname = raw.trim().replace(/\s+/g, ' ')
  if (nickname.length < 1 || nickname.length > 128) {
    return null
  }
  return nickname
}

router.get('/', async (req, res) => {
  const user = requireSessionUser(req, res)
  if (!user) {
    return
  }

  try {
    const rows = await UserFriend.findAll({
      where: { ownerPraktikumId: user.id },
      order: [['friendNickname', 'ASC']],
    })
    res.json(rows.map(rowToDto))
  } catch {
    res.status(500).json({ reason: 'Internal error' })
  }
})

router.post('/', async (req, res) => {
  const user = requireSessionUser(req, res)
  if (!user) {
    return
  }

  const nickname = parseNickname(req.body?.nickname)
  if (!nickname) {
    res.status(400).json({ reason: 'Invalid nickname' })
    return
  }

  const friendPraktikumId =
    typeof req.body?.friendPraktikumId === 'number' &&
    Number.isFinite(req.body.friendPraktikumId)
      ? Math.floor(req.body.friendPraktikumId)
      : null

  if (friendPraktikumId != null && friendPraktikumId === user.id) {
    res.status(400).json({ reason: 'Cannot add yourself' })
    return
  }

  const displayNameRaw = req.body?.displayName
  const displayName =
    typeof displayNameRaw === 'string' && displayNameRaw.trim()
      ? displayNameRaw.trim().slice(0, 255)
      : nickname

  const avatarRaw = req.body?.avatar
  const avatar =
    typeof avatarRaw === 'string' && avatarRaw.trim()
      ? avatarRaw.trim().slice(0, 512)
      : null

  try {
    const count = await UserFriend.count({
      where: { ownerPraktikumId: user.id },
    })
    if (count >= MAX_FRIENDS) {
      res.status(400).json({ reason: 'Friends limit reached' })
      return
    }

    const row = await UserFriend.create({
      ownerPraktikumId: user.id,
      friendNickname: nickname,
      friendPraktikumId,
      friendDisplayName: displayName,
      friendAvatar: avatar,
    })

    res.status(201).json(rowToDto(row))
  } catch (err) {
    if (err instanceof UniqueConstraintError) {
      res.status(409).json({ reason: 'Already in friends list' })
      return
    }
    res.status(500).json({ reason: 'Internal error' })
  }
})

router.delete('/:nickname', async (req, res) => {
  const user = requireSessionUser(req, res)
  if (!user) {
    return
  }

  const nickname = parseNickname(decodeURIComponent(req.params.nickname ?? ''))
  if (!nickname) {
    res.status(400).json({ reason: 'Invalid nickname' })
    return
  }

  try {
    const deleted = await UserFriend.destroy({
      where: {
        ownerPraktikumId: user.id,
        friendNickname: nickname,
      },
    })
    if (deleted === 0) {
      res.status(404).json({ reason: 'Friend not found' })
      return
    }
    res.status(204).send()
  } catch {
    res.status(500).json({ reason: 'Internal error' })
  }
})

export { router as friendsRouter }
