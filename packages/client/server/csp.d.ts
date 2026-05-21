import type {
  Express,
  NextFunction,
  Request,
  Response,
} from 'express'
export declare const CSP_NONCE_LOCAL = 'cspNonce'
export declare function createCspNonce(
  _req: Request,
  res: Response,
  next: NextFunction
): void
export declare function setSecurityHeaders(
  req: Request,
  res: Response,
  next: NextFunction
): void
export declare function registerCspMiddleware(
  app: Express
): void
export declare function getCspNonce(
  res: Response
): string
