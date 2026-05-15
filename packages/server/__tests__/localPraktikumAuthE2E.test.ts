import request from 'supertest'
import { createApp } from '../createApp'
import {
  getLocalBypassPraktikumUser,
  isLocalPraktikumAuthBypassEnabled,
} from '../middleware/localPraktikumAuthBypass'

describe('localPraktikumAuthBypass helpers', () => {
  const store: Record<
    string,
    string | undefined
  > = {}

  beforeEach(() => {
    store.NODE_ENV = process.env.NODE_ENV
    store.LOCAL_PRAKTIKUM_AUTH_BYPASS =
      process.env.LOCAL_PRAKTIKUM_AUTH_BYPASS
    store.LOCAL_PRAKTIKUM_USER_ID =
      process.env.LOCAL_PRAKTIKUM_USER_ID
    store.LOCAL_PRAKTIKUM_USER_DISPLAY =
      process.env.LOCAL_PRAKTIKUM_USER_DISPLAY
  })

  afterEach(() => {
    for (const k of Object.keys(store)) {
      const v = store[k]
      if (v === undefined) {
        delete process.env[k]
      } else {
        process.env[k] = v
      }
    }
  })

  it('is false in production even if flag is set', () => {
    process.env.NODE_ENV = 'production'
    process.env.LOCAL_PRAKTIKUM_AUTH_BYPASS = '1'
    expect(
      isLocalPraktikumAuthBypassEnabled()
    ).toBe(false)
  })

  it('is true in test when LOCAL_PRAKTIKUM_AUTH_BYPASS=1', () => {
    process.env.NODE_ENV = 'test'
    process.env.LOCAL_PRAKTIKUM_AUTH_BYPASS = '1'
    expect(
      isLocalPraktikumAuthBypassEnabled()
    ).toBe(true)
  })

  it('getLocalBypassPraktikumUser respects env overrides', () => {
    process.env.NODE_ENV = 'development'
    process.env.LOCAL_PRAKTIKUM_USER_ID = '42'
    process.env.LOCAL_PRAKTIKUM_USER_DISPLAY =
      'test-display'
    expect(getLocalBypassPraktikumUser()).toEqual(
      {
        id: 42,
        displayLabel: 'test-display',
      }
    )
  })
})

describe('LOCAL_PRAKTIKUM_AUTH_BYPASS (HTTP)', () => {
  const store: Record<
    string,
    string | undefined
  > = {}

  beforeEach(() => {
    store.NODE_ENV = process.env.NODE_ENV
    store.LOCAL_PRAKTIKUM_AUTH_BYPASS =
      process.env.LOCAL_PRAKTIKUM_AUTH_BYPASS
  })

  afterEach(() => {
    for (const k of Object.keys(store)) {
      const v = store[k]
      if (v === undefined) {
        delete process.env[k]
      } else {
        process.env[k] = v
      }
    }
  })

  it('GET /friends without Cookie returns 200 when bypass on', async () => {
    process.env.NODE_ENV = 'test'
    process.env.LOCAL_PRAKTIKUM_AUTH_BYPASS = '1'
    const app = createApp()
    const res = await request(app).get('/friends')
    expect(res.status).toBe(200)
    expect(Array.isArray(res.body)).toBe(true)
    expect(res.body).toHaveLength(3)
  })

  it('GET /friends without Cookie returns 403 when bypass off', async () => {
    process.env.NODE_ENV = 'test'
    delete process.env.LOCAL_PRAKTIKUM_AUTH_BYPASS
    const app = createApp()
    const res = await request(app).get('/friends')
    expect(res.status).toBe(403)
    expect(res.body).toEqual({
      reason: 'Forbidden',
    })
  })

  it('GET /friends returns 403 in production even with bypass flag', async () => {
    process.env.NODE_ENV = 'production'
    process.env.LOCAL_PRAKTIKUM_AUTH_BYPASS = '1'
    const app = createApp()
    const res = await request(app).get('/friends')
    expect(res.status).toBe(403)
  })
})
