import type { Request, Response } from 'express'
import { Op } from 'sequelize'
import {
  ANONYMOUS_SESSION_COOKIE,
  GUEST_SESSION_TTL_HOURS,
} from '../../constants/landingThemes'
import { AnonymousSession } from '../../models/AnonymousSession'

const GUEST_COOKIE_MAX_AGE_SEC =
  GUEST_SESSION_TTL_HOURS * 60 * 60

function guestSessionCutoff(): Date {
  return new Date(
    Date.now() -
      GUEST_SESSION_TTL_HOURS * 60 * 60 * 1000
  )
}

export function readGuestSessionId(
  req: Request
): string | null {
  const raw =
    req.cookies?.[ANONYMOUS_SESSION_COOKIE]
  if (
    typeof raw !== 'string' ||
    raw.trim() === ''
  ) {
    return null
  }
  return raw.trim()
}

export async function findActiveGuestSession(
  sessionId: string
): Promise<AnonymousSession | null> {
  const row = await AnonymousSession.findOne({
    where: {
      id: sessionId,
      updatedAt: {
        [Op.gt]: guestSessionCutoff(),
      },
    },
  })
  return row
}

export function setGuestSessionCookie(
  res: Response,
  sessionId: string
): void {
  res.cookie(
    ANONYMOUS_SESSION_COOKIE,
    sessionId,
    {
      httpOnly: true,
      maxAge: GUEST_COOKIE_MAX_AGE_SEC * 1000,
      sameSite: 'lax',
      secure:
        process.env.NODE_ENV === 'production',
      path: '/',
    }
  )
}

export async function touchGuestSession(
  session: AnonymousSession
): Promise<void> {
  await session.update({ updatedAt: new Date() })
}

export async function createGuestSession(): Promise<AnonymousSession> {
  return AnonymousSession.create({})
}
