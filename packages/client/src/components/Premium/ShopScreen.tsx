import React from 'react'

import { purchaseHintPack, PRICES } from '../../game/monetization/economy'
import { useWallet } from '../../game/monetization/useWallet'
import { Button } from '../../shared/ui'

type ShopScreenProps = {
  onToast?: (message: string) => void
}

export function ShopScreen({ onToast }: ShopScreenProps) {
  const { wallet, refresh } = useWallet()

  const buy = (
    label: string,
    action: () => { ok: boolean; reason?: string }
  ) => {
    const res = action()
    if (res.ok) {
      refresh()
      onToast?.(`${label} куплено`)
      return
    }
    onToast?.('reason' in res ? res.reason : 'Покупка не удалась')
  }

  return (
    <section className="premium-card">
      <div className="premium-card__header">
        <h2>Магазин артефактов</h2>
        <span className="premium-chip">Демо-IAP</span>
      </div>
      <p className="premium-muted">
        Баланс: {wallet.credits} кредитов · {wallet.crystals} кристаллов
      </p>
      <div className="premium-grid premium-grid--2">
        <article className="premium-panel">
          <div className="premium-panel__header">
            <h3>Бустеры и подсказки</h3>
          </div>
          <ul className="premium-offer-list">
            <li className="premium-offer-row">
              <div>
                <div>Пакет подсказок ×{PRICES.hintPackShop.amount}</div>
                <div className="premium-soft-note">
                  {PRICES.hintPackShop.credits} кр. /{' '}
                  {PRICES.hintPackShop.crystals} крист.
                </div>
              </div>
              <div className="premium-stack premium-stack--row">
                <Button
                  variant="outline"
                  onClick={() =>
                    buy('Пакет подсказок', () => purchaseHintPack('credits'))
                  }>
                  Кредиты
                </Button>
                <Button
                  variant="flat"
                  onClick={() =>
                    buy('Пакет подсказок', () => purchaseHintPack('crystals'))
                  }>
                  Кристаллы
                </Button>
              </div>
            </li>
            <li className="premium-offer-row">
              <div>
                <div>Мгновенная подсказка</div>
                <div className="premium-soft-note">
                  {PRICES.hint.credits} кр. или {PRICES.hint.crystals} крист. за
                  ход
                </div>
              </div>
              <span className="premium-price-badge premium-price-badge--new">
                В игре
              </span>
            </li>
          </ul>
        </article>
        <article className="premium-panel">
          <div className="premium-panel__header">
            <h3>Косметика</h3>
          </div>
          <ul className="premium-offer-list">
            <li className="premium-offer-row">
              <div>
                <div>Свой фон арены</div>
                <div className="premium-soft-note">
                  {PRICES.customBg.credits} кр. / {PRICES.customBg.crystals}{' '}
                  крист. (разово)
                </div>
              </div>
              <span className="premium-price-badge premium-price-badge--premium">
                Настройки
              </span>
            </li>
            <li className="premium-offer-row">
              <div>
                <div>Тема поля «Nebula»</div>
                <div className="premium-soft-note">120 кристаллов (скоро)</div>
              </div>
              <span className="premium-price-badge premium-price-badge--limited">
                Скоро
              </span>
            </li>
          </ul>
        </article>
      </div>
    </section>
  )
}
