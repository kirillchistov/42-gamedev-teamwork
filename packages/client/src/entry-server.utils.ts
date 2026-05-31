import { Request as ExpressRequest } from 'express'
import { PageInitContext } from './routes'

export const createContext = (req: ExpressRequest): PageInitContext => ({
  clientToken: req.cookies.token,
})

export const createUrl = (req: ExpressRequest) => {
  const forwardedHost = req.get('x-forwarded-host')?.split(',')[0]?.trim()
  const host =
    req.get('host') ||
    forwardedHost ||
    process.env.PUBLIC_HOST?.trim() ||
    'localhost'
  const forwardedProto = req.get('x-forwarded-proto')?.split(',')[0]?.trim()
  const protocol = forwardedProto || req.protocol || 'http'

  return new URL(req.originalUrl || req.url, `${protocol}://${host}`)
}

export const createFetchRequest = (req: ExpressRequest) => {
  const url = createUrl(req)

  const controller = new AbortController()
  req.on('close', () => controller.abort())

  const headers = new Headers()

  for (const [key, values] of Object.entries(req.headers)) {
    if (values) {
      if (Array.isArray(values)) {
        for (const value of values) {
          headers.append(key, value)
        }
      } else {
        headers.set(key, values)
      }
    }
  }

  const init: {
    method: string
    headers: Headers
    signal: AbortSignal
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    body?: any
  } = {
    method: req.method,
    headers,
    signal: controller.signal,
  }

  if (req.method !== 'GET' && req.method !== 'HEAD') {
    init.body = req.body
  }

  return new Request(url.href, init)
}
