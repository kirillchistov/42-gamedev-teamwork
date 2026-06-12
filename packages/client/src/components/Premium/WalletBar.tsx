import React from 'react'

import { useWallet } from '../../game/monetization/useWallet'

type WalletBarProps = {
  compact?: boolean
}

export function WalletBar({ compact = false }: WalletBarProps) {
  const { wallet, dayStats } = useWallet()

  return (
    <div
      className={
        compact ? 'premium-wallet premium-wallet--compact' : 'premium-wallet'
      }
      aria-label="Баланс валют">
      <span className="premium-wallet__item">
        <span className="premium-wallet__label">Кредиты</span>
        <strong>{wallet.credits.toLocaleString('ru-RU')}</strong>
      </span>
      <span className="premium-wallet__item premium-wallet__item--crystals">
        <span className="premium-wallet__label">Кристаллы</span>
        <strong>{wallet.crystals.toLocaleString('ru-RU')}</strong>
      </span>
      {!compact ? (
        <span className="premium-soft-note premium-wallet__meta">
          Бесплатные подсказки сегодня: {dayStats.freeHintsUsed}/3
        </span>
      ) : null}
    </div>
  )
}
