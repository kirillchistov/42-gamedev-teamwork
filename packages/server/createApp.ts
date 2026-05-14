import express from 'express'
import cors from 'cors'
import { requirePraktikumAuth } from './middleware/requirePraktikumAuth'
import { forumRouter } from './routes/forumRouter'

/**
 * HTTP-приложение без listen — для supertest и e2e.
 */
export function createApp(): express.Express {
  const app = express()
  app.use(cors())
  app.use(express.json())

  app.use(
    '/api/forum',
    requirePraktikumAuth,
    forumRouter
  )

  app.get(
    '/friends',
    requirePraktikumAuth,
    (_, res) => {
      res.json([
        { name: 'Саша', secondName: 'Панов' },
        {
          name: 'Лёша',
          secondName: 'Садовников',
        },
        { name: 'Серёжа', secondName: 'Иванов' },
      ])
    }
  )

  app.get(
    '/user',
    requirePraktikumAuth,
    (_, res) => {
      res.json({
        name: '</script>Степа',
        secondName: 'Степанов',
      })
    }
  )

  app.get('/', (_, res) => {
    res.json('👋 Howdy from the server :)')
  })

  return app
}
