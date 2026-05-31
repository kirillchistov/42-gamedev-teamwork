import request from 'supertest'
import { createApp } from '../createApp'
import { UserFriend } from '../models/UserFriend'

describe('/friends API', () => {
  const envStore: Record<string, string | undefined> = {}

  beforeEach(() => {
    envStore.NODE_ENV = process.env.NODE_ENV
    envStore.LOCAL_PRAKTIKUM_AUTH_BYPASS =
      process.env.LOCAL_PRAKTIKUM_AUTH_BYPASS
    envStore.LOCAL_PRAKTIKUM_USER_ID = process.env.LOCAL_PRAKTIKUM_USER_ID
    process.env.NODE_ENV = 'test'
    process.env.LOCAL_PRAKTIKUM_AUTH_BYPASS = '1'
    process.env.LOCAL_PRAKTIKUM_USER_ID = '5861'
  })

  afterEach(async () => {
    await UserFriend.destroy({
      where: { ownerPraktikumId: 5861 },
    })
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
