import crypto from 'crypto'
import type { Express, NextFunction, Request, Response } from 'express'
import { buildSsrCspHeader } from './cspPolicy'

export const CSP_NONCE_LOCAL = 'cspNonce'

export function createCspNonce(
  _req: Request,
  res: Response,
  next: NextFunction
): void {
  res.locals[CSP_NONCE_LOCAL] = crypto.randomBytes(16).toString('base64')
  next()
}

export function setSecurityHeaders(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const nonce = String(res.locals[CSP_NONCE_LOCAL] ?? '')
  if (nonce) {
    res.setHeader('Content-Security-Policy', buildSsrCspHeader(nonce))
  }
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.setHeader('X-Frame-Options', 'SAMEORIGIN')
  res.setHeader('X-XSS-Protection', '1; mode=block')
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin')
  res.setHeader(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(self)'
  )
  next()
}

export function registerCspMiddleware(app: Express): void {
  app.use(createCspNonce)
  app.use(setSecurityHeaders)
}

export function getCspNonce(res: Response): string {
  return String(res.locals[CSP_NONCE_LOCAL] ?? '')
}

/** Nonce на все <script> из Vite index.html (module entry и т.д.), кроме уже помеченных. */
export function injectHtmlScriptNonces(html: string, nonce: string): string {
  if (!nonce) return html
  return html.replace(
    /<script(?![^>]*\snonce=)(?=[\s>])/gi,
    `<script nonce="${nonce}"`
  )
}
