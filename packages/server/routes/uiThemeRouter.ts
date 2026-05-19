import { Router } from 'express'
import { isLandingThemeId } from '../constants/landingThemes'
import {
  getThemeForRequest,
  putThemeForRequest,
} from './uiTheme/themeService'

const router = Router()

router.get('/', async (req, res) => {
  try {
    const theme = await getThemeForRequest(req)
    res.json({ theme })
  } catch {
    res
      .status(500)
      .json({ reason: 'Internal error' })
  }
})

router.put('/', async (req, res) => {
  try {
    const body = req.body as unknown
    if (
      body === null ||
      typeof body !== 'object'
    ) {
      res
        .status(400)
        .json({ reason: 'Invalid body' })
      return
    }
    const theme = (body as { theme?: unknown })
      .theme
    if (!isLandingThemeId(theme)) {
      res
        .status(400)
        .json({ reason: 'Invalid theme' })
      return
    }

    const saved = await putThemeForRequest(
      req,
      res,
      theme
    )
    res.json({ theme: saved })
  } catch {
    res
      .status(500)
      .json({ reason: 'Internal error' })
  }
})

export { router as uiThemeRouter }
