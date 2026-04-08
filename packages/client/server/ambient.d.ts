declare module 'cookie-parser' {
  import type { RequestHandler } from 'express'
  function cookieParser(
    secret?: string,
    options?: unknown
  ): RequestHandler
  export = cookieParser
}

declare module 'serialize-javascript' {
  export default function serialize(
    input: unknown,
    options?: { isJSON?: boolean }
  ): string
}
