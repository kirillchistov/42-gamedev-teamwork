// Express для SSR: в dev — Vite в 'middlewareMode', в prod — статика 'dist/client' и серверный бандл;
// парсинг cookie, сериализация начального состояния Redux в HTML.
// 7.1.1 Добавил GET /health, GET /ssr-static (отдельный render-функционал)
// 7.1.1 Вынес загрузку SSR-модуля в helper (resolveSsrRender)
// 7.1.1 Добавил централизованный error handler
// 7.1.1 Сохранил текущий app.get('*') для основного SSR "из коробки"

import dotenv from 'dotenv'
dotenv.config()

import { HelmetData } from 'react-helmet'
import express, {
  NextFunction,
  Request as ExpressRequest,
  Response,
} from 'express'
import path from 'path'

import fs from 'fs/promises'
import {
  createServer as createViteServer,
  ViteDevServer,
} from 'vite'
import serialize from 'serialize-javascript'
import cookieParser from 'cookie-parser'
import { renderStaticPageHtml } from './static-page'

const clientPath = path.join(__dirname, '..')
const isDev =
  process.env.NODE_ENV === 'development'
const FALLBACK_PORTS = [3000, 5000, 9000, 8080]
let prodTemplateCache: string | null = null

type SsrRenderResult = {
  html: string
  initialState: unknown
  helmet: HelmetData
  styleTags: string
}

type SsrRender = (
  req: ExpressRequest
) => Promise<SsrRenderResult>

type RouterResponse = {
  status: number
  headers: {
    forEach: (
      callback: (
        value: string,
        key: string
      ) => void
    ) => void
    get: (name: string) => string | null
  }
  text: () => Promise<string>
}

function toValidPort(
  value: string | undefined
): number | null {
  if (!value) return null
  const parsed = Number(value)
  if (
    !Number.isInteger(parsed) ||
    parsed < 1 ||
    parsed > 65535
  ) {
    return null
  }
  return parsed
}

function resolvePortCandidates(): number[] {
  const candidates = [
    toValidPort(process.env.PORT),
    toValidPort(process.env.CLIENT_PORT),
    ...FALLBACK_PORTS,
  ].filter(
    (port): port is number => port !== null
  )
  return [...new Set(candidates)]
}

async function sendRouterResponse(
  response: RouterResponse,
  res: Response
) {
  response.headers.forEach((value, key) => {
    if (key.toLowerCase() === 'set-cookie') {
      return
    }
    res.setHeader(key, value)
  })

  const setCookieHeader =
    response.headers.get('set-cookie')
  if (setCookieHeader) {
    res.append('set-cookie', setCookieHeader)
  }

  const body = await response.text()
  if (body) {
    res.status(response.status).send(body)
    return
  }

  res.sendStatus(response.status)
}

function isRouterResponse(
  value: unknown
): value is RouterResponse {
  if (
    typeof value !== 'object' ||
    value === null
  ) {
    return false
  }

  const maybeResponse =
    value as Partial<RouterResponse>
  return (
    typeof maybeResponse.status === 'number' &&
    typeof maybeResponse.text === 'function' &&
    typeof maybeResponse.headers === 'object' &&
    maybeResponse.headers !== null &&
    typeof maybeResponse.headers.get ===
      'function' &&
    typeof maybeResponse.headers.forEach ===
      'function'
  )
}

async function resolveSsrRender(
  vite: ViteDevServer | undefined,
  url: string
): Promise<{
  render: SsrRender
  template: string
}> {
  if (vite) {
    let template = await fs.readFile(
      path.resolve(clientPath, 'index.html'),
      'utf-8'
    )
    template = await vite.transformIndexHtml(
      url,
      template
    )
    const ssrModule = await vite.ssrLoadModule(
      path.join(
        clientPath,
        'src/entry-server.tsx'
      )
    )
    return {
      render: ssrModule.render as SsrRender,
      template,
    }
  }

  if (!prodTemplateCache) {
    prodTemplateCache = await fs.readFile(
      path.join(
        clientPath,
        'dist/client/index.html'
      ),
      'utf-8'
    )
  }
  const pathToServer = path.join(
    clientPath,
    'dist/server/entry-server.js'
  )
  const ssrModule = await import(pathToServer)
  return {
    render: ssrModule.render as SsrRender,
    template: prodTemplateCache,
  }
}

function registerCommonRoutes(
  app: express.Express
) {
  app.get('/health', (_req, res) => {
    res.status(200).json({
      ok: true,
      mode: isDev ? 'development' : 'production',
    })
  })

  // SSR-маршрут без Redux: только renderToString + res.send.
  app.get('/ssr-static', (_req, res) => {
    res
      .status(200)
      .set({ 'Content-Type': 'text/html' })
      .send(renderStaticPageHtml())
  })
}

function registerErrorHandler(
  app: express.Express
) {
  app.use(
    (
      err: unknown,
      _req: express.Request,
      res: Response,
      next: NextFunction
    ) => {
      // Error handler must keep 4 args signature for Express.
      void next
      console.error(err)
      res
        .status(500)
        .type('text/plain')
        .send('SSR error')
    }
  )
}

async function createServer() {
  const app = express()
  const portCandidates = resolvePortCandidates()

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
  registerCommonRoutes(app)

  app.get('*', async (req, res, next) => {
    const url = req.originalUrl

    try {
      const { render, template } =
        await resolveSsrRender(vite, url)

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
      if (isRouterResponse(e)) {
        await sendRouterResponse(e, res)
        return
      }
      vite?.ssrFixStacktrace(e as Error)
      next(e)
    }
  })
  registerErrorHandler(app)

  const tryListen = (index: number) => {
    const port = portCandidates[index]
    if (port === undefined) {
      throw new Error(
        'No available port from PORT/CLIENT_PORT/fallback list'
      )
    }

    const server = app
      .listen(port, () => {
        console.log(
          `Client is listening on port: ${port}`
        )
      })
      .on('error', err => {
        if (
          (err as NodeJS.ErrnoException).code ===
            'EADDRINUSE' &&
          index < portCandidates.length - 1
        ) {
          console.warn(
            `Port ${port} is busy, trying next port...`
          )
          tryListen(index + 1)
          return
        }
        throw err
      })
    return server
  }

  tryListen(0)
}

createServer()
