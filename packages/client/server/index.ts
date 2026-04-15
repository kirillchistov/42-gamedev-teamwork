// Express для SSR: в dev — Vite в 'middlewareMode', в prod — статика 'dist/client' и серверный бандл;
// парсинг cookie, сериализация начального состояния Redux в HTML.
import dotenv from 'dotenv'
dotenv.config()

import { HelmetData } from 'react-helmet'
import express, {
  Request as ExpressRequest,
} from 'express'
import path from 'path'

import fs from 'fs/promises'
import {
  createServer as createViteServer,
  ViteDevServer,
} from 'vite'
import serialize from 'serialize-javascript'
import cookieParser from 'cookie-parser'

const port = process.env.PORT || 80
const clientPath = path.join(__dirname, '..')
const isDev =
  process.env.NODE_ENV === 'development'

async function createServer() {
  const app = express()

  app.use(cookieParser())
  let vite: ViteDevServer | undefined
  if (isDev) {
    vite = await createViteServer({
      server: { middlewareMode: true },
      root: clientPath,
      appType: 'custom',
    })

    app.use(vite.middlewares)
  } else {
    app.use(
      express.static(
        path.join(clientPath, 'dist/client'),
        { index: false }
      )
    )
  }

  app.get('*', async (req, res, next) => {
    const url = req.originalUrl

    try {
      // Получаю файл client/index.html и создаю переменные
      let render: (
        req: ExpressRequest
      ) => Promise<{
        html: string
        initialState: unknown
        helmet: HelmetData
        styleTags: string
      }>
      let template: string
      if (vite) {
        template = await fs.readFile(
          path.resolve(clientPath, 'index.html'),
          'utf-8'
        )

        // Применяю встроенные HTML-преобразования vite и плагинов
        template = await vite.transformIndexHtml(
          url,
          template
        )

        // Загружаю модуль клиента, который будет рендерить HTML
        render = (
          await vite.ssrLoadModule(
            path.join(
              clientPath,
              'src/entry-server.tsx'
            )
          )
        ).render
      } else {
        template = await fs.readFile(
          path.join(
            clientPath,
            'dist/client/index.html'
          ),
          'utf-8'
        )

        // Получаю путь до собранного модуля клиента
        const pathToServer = path.join(
          clientPath,
          'dist/server/entry-server.js'
        )

        // Импортирю этот модуль и вызываю с начальным стейтом
        render = (await import(pathToServer))
          .render
      }

      // Получаю HTML-строку из JSX
      const {
        html: appHtml,
        initialState,
        helmet,
        styleTags,
      } = await render(req)

      // Заменяю комментарий на сгенерированную HTML-строку
      const html = template
        .replace('<!--ssr-styles-->', styleTags)
        .replace(
          `<!--ssr-helmet-->`,
          `${helmet.meta.toString()} ${helmet.title.toString()} ${helmet.link.toString()}`
        )
        .replace(`<!--ssr-outlet-->`, appHtml)
        .replace(
          `<!--ssr-initial-state-->`,
          `<script>window.APP_INITIAL_STATE = ${serialize(
            initialState,
            {
              isJSON: true,
            }
          )}</script>`
        )

      // Завершаю запрос и отдаю HTML-страницу
      res
        .status(200)
        .set({ 'Content-Type': 'text/html' })
        .end(html)
    } catch (e) {
      vite?.ssrFixStacktrace(e as Error)
      next(e)
    }
  })

  app.listen(port, () => {
    console.log(
      `Client is listening on port: ${port}`
    )
  })
}

createServer()
