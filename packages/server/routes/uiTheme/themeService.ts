import type { Request, Response } from 'express'
import type { LandingThemeId } from '../../constants/landingThemes'
import { DEFAULT_LANDING_THEME } from '../../constants/landingThemes'
import { UserUiTheme } from '../../models/UserUiTheme'
import { praktikumUserIdForDb } from '../../middleware/praktikumUser'
import {
  createGuestSession,
  findActiveGuestSession,
  readGuestSessionId,
  setGuestSessionCookie,
  touchGuestSession,
} from './guestSession'

export async function getThemeForRequest(
  req: Request
): Promise<LandingThemeId> {
  if (req.praktikumUser) {
    const pid = praktikumUserIdForDb(
      req.praktikumUser
    )
    const row = await UserUiTheme.findOne({
      where: { praktikumUserId: pid },
    })
    return row?.theme ?? DEFAULT_LANDING_THEME
  }

  const guestId = readGuestSessionId(req)
  if (!guestId) {
    return DEFAULT_LANDING_THEME
  }

  const session = await findActiveGuestSession(
    guestId
  )
  if (!session) {
    return DEFAULT_LANDING_THEME
  }

  await touchGuestSession(session)

  const row = await UserUiTheme.findOne({
    where: { anonymousSessionId: session.id },
  })
  return row?.theme ?? DEFAULT_LANDING_THEME
}

export async function putThemeForRequest(
  req: Request,
  res: Response,
  theme: LandingThemeId
): Promise<LandingThemeId> {
  if (req.praktikumUser) {
    const pid = praktikumUserIdForDb(
      req.praktikumUser
    )
    const existing = await UserUiTheme.findOne({
      where: { praktikumUserId: pid },
    })
    if (existing) {
      await existing.update({ theme })
    } else {
      await UserUiTheme.create({
        theme,
        praktikumUserId: pid,
        anonymousSessionId: null,
      })
    }
    return theme
  }

  const guestId = readGuestSessionId(req)
  let session =
    guestId != null
      ? await findActiveGuestSession(guestId)
      : null

  if (!session) {
    session = await createGuestSession()
    setGuestSessionCookie(res, session.id)
  } else {
    await touchGuestSession(session)
    setGuestSessionCookie(res, session.id)
  }

  const existing = await UserUiTheme.findOne({
    where: { anonymousSessionId: session.id },
  })
  if (existing) {
    await existing.update({ theme })
  } else {
    await UserUiTheme.create({
      theme,
      praktikumUserId: null,
      anonymousSessionId: session.id,
    })
  }

  return theme
}
