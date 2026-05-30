import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import { attachPraktikumUser } from './middleware/attachPraktikumUser'
import { requirePraktikumAuth } from './middleware/requirePraktikumAuth'
import { forumRouter } from './routes/forumRouter'
import { uiThemeRouter } from './routes/uiThemeRouter'
import { sequelize } from './sequelize'

/**
 * HTTP-приложение без listen — для supertest и e2e.
 *
 * Публично: GET `/`, `/api/ui/theme` (гость или авторизованный).
 * Защищённые ручки — на `protectedRouter` с `requirePraktikumAuth`.
 */
// 8.10 demo MCR (sprint_8):
// /**
//  * HTTP-app без listen — для локальных тестов (supertest, e2e).
//  */
export function createApp(): express.Express {
  const app = express()
  app.use(
    cors({
      origin: true,
      credentials: true,
    })
  )
  app.use(cookieParser())
  app.use(express.json())

  app.use('/api/ui/theme', attachPraktikumUser, uiThemeRouter)

  // 8.10 demo MCR (sprint_8 — forum на app, не на protectedRouter):
  // app.use(
  //   '/api/forum',
  //   requirePraktikumAuth,
  //   forumRouter
  // )
  //
  // app.get('/health', (_, res) => {
  //   res.status(200).json({
  //     ok: true,
  //   })
  // })
  //
  // app.get('/', (_, res) => {
  //   res.json('👋 Howdy from the server :)')
  // })

  const protectedRouter = express.Router()
  protectedRouter.use(requirePraktikumAuth)
  protectedRouter.use('/api/forum', forumRouter)
  protectedRouter.get('/friends', (_, res) => {
    res.json([
      { name: 'Саша', secondName: 'Панов' },
      {
        name: 'Лёша',
        secondName: 'Садовников',
      },
      { name: 'Серёжа', secondName: 'Иванов' },
    ])
  })
  protectedRouter.get('/user', (_, res) => {
    res.json({
      name: '</script>Степа',
      secondName: 'Степанов',
    })
  })

  app.get('/health', async (_req, res) => {
    try {
      await sequelize.authenticate()
      res.status(200).json({ ok: true, db: true })
    } catch {
      res.status(503).json({ ok: false, db: false })
    }
  })

  app.use(protectedRouter)

  app.get('/', (_req, res) => {
    res.json('👋 Howdy from the server :)')
  })

  return app
}
