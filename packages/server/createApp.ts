import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import { attachPraktikumUser } from './middleware/attachPraktikumUser'
import { requirePraktikumAuth } from './middleware/requirePraktikumAuth'
import { forumRouter } from './routes/forumRouter'
import { uiThemeRouter } from './routes/uiThemeRouter'

/**
 * HTTP-приложение без listen — для supertest и e2e.
 *
 * Публично: GET `/`, `/api/ui/theme` (гость или авторизованный).
 * Защищённые ручки — на `protectedRouter` с `requirePraktikumAuth`.
 */
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

  app.use(
    '/api/ui/theme',
    attachPraktikumUser,
    uiThemeRouter
  )

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

  app.use(protectedRouter)

  app.get('/', (_, res) => {
    res.json('👋 Howdy from the server :)')
  })

  return app
}
