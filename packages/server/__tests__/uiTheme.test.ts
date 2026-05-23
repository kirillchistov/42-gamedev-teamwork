import request from 'supertest'
import { createApp } from '../createApp'

describe('/api/ui/theme', () => {
  it('GET without cookie returns default theme', async () => {
    const app = createApp()
    const res = await request(app).get(
      '/api/ui/theme'
    )
    expect(res.status).toBe(200)
    expect(res.body).toEqual({
      theme: 'light-flat',
    })
  })

  it('PUT with invalid theme returns 400', async () => {
    const app = createApp()
    const res = await request(app)
      .put('/api/ui/theme')
      .send({ theme: 'invalid' })
    expect(res.status).toBe(400)
    expect(res.body).toEqual({
      reason: 'Invalid theme / Неверная тема',
    })
  })

  it('PUT without body returns 400', async () => {
    const app = createApp()
    const res = await request(app)
      .put('/api/ui/theme')
      .send({})
    expect(res.status).toBe(400)
  })
})
