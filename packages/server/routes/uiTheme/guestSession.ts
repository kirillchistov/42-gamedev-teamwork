import type { Request, Response } from 'express'
import { Op } from 'sequelize'
import {
  ANONYMOUS_SESSION_COOKIE,
  GUEST_SESSION_TTL_HOURS,
} from '../../constants/landingThemes'
import { AnonymousSession } from '../../models/AnonymousSession'

const GUEST_COOKIE_MAX_AGE_SEC = GUEST_SESSION_TTL_HOURS * 60 * 60

/** PostgreSQL UUID — отбрасываем битые значения из cookie (иначе Sequelize → 500). */
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function guestSessionCutoff(): Date {
  return new Date(Date.now() - GUEST_SESSION_TTL_HOURS * 60 * 60 * 1000)
}

export function readGuestSessionId(req: Request): string | null {
  const raw = req.cookies?.[ANONYMOUS_SESSION_COOKIE]
  if (typeof raw !== 'string' || raw.trim() === '') {
    return null
  }
  const id = raw.trim()
  if (!UUID_RE.test(id)) {
    return null
  }
  return id
}

export async function findActiveGuestSession(
  sessionId: string
): Promise<AnonymousSession | null> {
  if (!UUID_RE.test(sessionId)) {
    return null
  }
  try {
    const row = await AnonymousSession.findOne({
      where: {
        id: sessionId,
        updatedAt: {
          [Op.gt]: guestSessionCutoff(),
        },
      },
    })
    return row
  } catch {
    return null
  }
}

export function setGuestSessionCookie(res: Response, sessionId: string): void {
  // Снять legacy cookie с Path=/ — иначе уходит на /api/v2 и ломает signin Практикума.
  res.clearCookie(ANONYMOUS_SESSION_COOKIE, { path: '/' })
  res.cookie(ANONYMOUS_SESSION_COOKIE, sessionId, {
    httpOnly: true,
    maxAge: GUEST_COOKIE_MAX_AGE_SEC * 1000,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/api/ui',
  })
}

export async function touchGuestSession(
  session: AnonymousSession
): Promise<void> {
  await session.update({ updatedAt: new Date() })
}

export async function createGuestSession(): Promise<AnonymousSession> {
  return AnonymousSession.create({})
}
