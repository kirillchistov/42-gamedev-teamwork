// Express для SSR: в dev — Vite в 'middlewareMode', в prod — статика 'dist/client' и серверный бандл;
// парсинг cookie, сериализация начального состояния Redux в HTML.
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
const DEFAULT_PORT_FALLBACK_CHAIN = [
  3000, 5000, 9000, 8080,
]

function parsePort(
  value: string | undefined
): number | null {
  if (!value) return null
  const parsed = Number(value)
  if (
    !Number.isInteger(parsed) ||
    parsed <= 0 ||
    parsed > 65535
  ) {
    return null
  }
  return parsed
}

function resolvePortCandidates(): number[] {
  const preferred = [
    parsePort(process.env.PORT),
    parsePort(process.env.CLIENT_PORT),
  ].filter((p): p is number => p !== null)
  const all = [
    ...preferred,
    ...DEFAULT_PORT_FALLBACK_CHAIN,
  ]
  return Array.from(new Set(all))
}

function listenOnPort(
  app: express.Express,
  port: number
): Promise<void> {
  return new Promise((resolve, reject) => {
    const server = app.listen(port, () => {
      server.off('error', onError)
      resolve()
    })
    const onError = (error: unknown) => {
      server.off('error', onError)
      reject(error)
    }
    server.on('error', onError)
  })
}

async function startServerWithPortFallback(
  app: express.Express
): Promise<number> {
  const candidates = resolvePortCandidates()
  let lastError: unknown = null
  for (const candidate of candidates) {
    try {
      await listenOnPort(app, candidate)
      return candidate
    } catch (error) {
      const e = error as NodeJS.ErrnoException
      if (e?.code !== 'EADDRINUSE') {
        throw error
      }
      lastError = error
    }
  }
  throw (
    lastError ??
    new Error(
      `No available port in chain: ${candidates.join(
        ', '
      )}`
    )
  )
}

type SsrRenderResult = {
  html: string
  initialState: unknown
  helmet: HelmetData
  styleTags: string
}

type SsrRender = (
  req: ExpressRequest
) => Promise<SsrRenderResult>

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

  const template = await fs.readFile(
    path.join(
      clientPath,
      'dist/client/index.html'
    ),
    'utf-8'
  )
  const pathToServer = path.join(
    clientPath,
    'dist/server/entry-server.js'
  )
  const ssrModule = await import(pathToServer)
  return {
    render: ssrModule.render as SsrRender,
    template,
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

  // Формальный SSR-маршрут без Redux: демонстрирует renderToString + res.send.
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
      _next: NextFunction
    ) => {
      console.error(err)
      res
        .status(500)
        .type('text/plain')
        .send('SSR error')
    }
  )
}

async function tryHandleRouterResponse(
  maybeResponse: unknown,
  res: Response
): Promise<boolean> {
  if (!isRouterResponse(maybeResponse)) {
    return false
  }

  const location =
    maybeResponse.headers.get('location')
  if (location) {
    res.redirect(
      maybeResponse.status || 302,
      location
    )
    return true
  }

  const text = await maybeResponse
    .text()
    .catch(() => '')

  res
    .status(maybeResponse.status || 500)
    .set({
      'Content-Type':
        maybeResponse.headers.get(
          'content-type'
        ) ?? 'text/plain',
    })
    .send(text)

  return true
}

type RouterResponseLike = {
  status: number
  headers: {
    get(name: string): string | null
  }
  text(): Promise<string>
}

function isRouterResponse(
  value: unknown
): value is RouterResponseLike {
  if (!value || typeof value !== 'object') {
    return false
  }
  const candidate =
    value as Partial<RouterResponseLike>
  return (
    typeof candidate.status === 'number' &&
    typeof candidate.text === 'function' &&
    !!candidate.headers &&
    typeof candidate.headers.get === 'function'
  )
}

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
      if (await tryHandleRouterResponse(e, res)) {
        return
      }
      vite?.ssrFixStacktrace(e as Error)
      next(e)
    }
  })
  registerErrorHandler(app)

  const actualPort =
    await startServerWithPortFallback(app)
  console.log(
    `Client is listening on port: ${actualPort}`
  )
}

createServer()
