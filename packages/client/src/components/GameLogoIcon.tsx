import React from 'react'
import clsx from 'clsx'

import { COSMIC_MATCH_LOGO_URL } from '../shared/brandAssets'

type Props = {
  className?: string
  size?: number
}

/** Логотип Cosmic Match (PNG из макета landing-logo__icon). */
export function GameLogoIcon({ className, size = 32 }: Props) {
  return (
    <img
      src={COSMIC_MATCH_LOGO_URL}
      alt=""
      width={size}
      height={size}
      className={clsx('landing-logo__icon', className)}
      decoding="async"
    />
  )
}
