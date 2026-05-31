import request from 'supertest'
import { UniqueConstraintError } from 'sequelize'
import { createApp } from '../createApp'
import { UserFriend } from '../models/UserFriend'

jest.mock('../models/UserFriend', () => ({
  UserFriend: {
    findAll: jest.fn(),
    count: jest.fn(),
    create: jest.fn(),
    destroy: jest.fn(),
  },
}))

const UserFriendMock = UserFriend as jest.Mocked<typeof UserFriend>

type FriendRow = {
  ownerPraktikumId: number
  friendNickname: string
  friendDisplayName: string
  friendAvatar: string | null
  friendPraktikumId: number | null
}

describe('/friends API (HTTP, mocked DB)', () => {
  const envStore: Record<string, string | undefined> = {}
  let store: FriendRow[] = []

  beforeEach(() => {
    envStore.NODE_ENV = process.env.NODE_ENV
    envStore.LOCAL_PRAKTIKUM_AUTH_BYPASS =
      process.env.LOCAL_PRAKTIKUM_AUTH_BYPASS
    envStore.LOCAL_PRAKTIKUM_USER_ID = process.env.LOCAL_PRAKTIKUM_USER_ID
    process.env.NODE_ENV = 'test'
    process.env.LOCAL_PRAKTIKUM_AUTH_BYPASS = '1'
    process.env.LOCAL_PRAKTIKUM_USER_ID = '5861'

    store = []
    jest.clearAllMocks()

    UserFriendMock.findAll.mockImplementation(async options => {
      const where = options?.where as { ownerPraktikumId?: number } | undefined
      const ownerId = where?.ownerPraktikumId ?? 0
      return store
        .filter(row => row.ownerPraktikumId === ownerId)
        .sort((a, b) => a.friendNickname.localeCompare(b.friendNickname))
        .map(row => ({ ...row } as UserFriend))
    })

    UserFriendMock.count.mockImplementation(async options => {
      const where = options?.where as { ownerPraktikumId?: number } | undefined
      const ownerId = where?.ownerPraktikumId ?? 0
      return store.filter(row => row.ownerPraktikumId === ownerId).length
    })

    UserFriendMock.create.mockImplementation(async data => {
      const payload = data as FriendRow
      const ownerId = payload.ownerPraktikumId
      const nickname = payload.friendNickname
      const exists = store.some(
        row =>
          row.ownerPraktikumId === ownerId && row.friendNickname === nickname
      )
      if (exists) {
        throw new UniqueConstraintError({ message: 'duplicate' })
      }
      const row: FriendRow = {
        ownerPraktikumId: ownerId,
        friendNickname: nickname,
        friendDisplayName: payload.friendDisplayName || nickname,
        friendAvatar: payload.friendAvatar ?? null,
        friendPraktikumId: payload.friendPraktikumId ?? null,
      }
      store.push(row)
      return row as UserFriend
    })

    UserFriendMock.destroy.mockImplementation(async options => {
      const where = options?.where as
        | { ownerPraktikumId?: number; friendNickname?: string }
        | undefined
      const ownerId = where?.ownerPraktikumId ?? 0
      const nickname = where?.friendNickname ?? ''
      const before = store.length
      store = store.filter(
        row =>
          !(row.ownerPraktikumId === ownerId && row.friendNickname === nickname)
      )
      return before - store.length
    })
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

  it('GET /friends → empty list initially', async () => {
    const app = createApp()
    const res = await request(app).get('/friends')
    expect(res.status).toBe(200)
    expect(res.body).toEqual([])
  })

  it('POST and DELETE /friends manage list', async () => {
    const app = createApp()

    const created = await request(app).post('/friends').send({
      nickname: 'buddy_one',
      displayName: 'Buddy One',
      friendPraktikumId: 100,
    })
    expect(created.status).toBe(201)
    expect(created.body).toMatchObject({
      nickname: 'buddy_one',
      displayName: 'Buddy One',
    })

    const list = await request(app).get('/friends')
    expect(list.status).toBe(200)
    expect(list.body).toHaveLength(1)

    const dup = await request(app)
      .post('/friends')
      .send({ nickname: 'buddy_one' })
    expect(dup.status).toBe(409)

    const removed = await request(app).delete('/friends/buddy_one')
    expect(removed.status).toBe(204)

    const after = await request(app).get('/friends')
    expect(after.body).toEqual([])
  })

  it('POST /friends rejects adding yourself', async () => {
    const app = createApp()
    const res = await request(app).post('/friends').send({
      nickname: 'self',
      friendPraktikumId: 5861,
    })
    expect(res.status).toBe(400)
    expect(res.body).toEqual({ reason: 'Cannot add yourself' })
  })
})
