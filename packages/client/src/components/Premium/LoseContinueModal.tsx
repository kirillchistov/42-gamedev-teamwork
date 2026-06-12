import React from 'react'

import {
  canPayContinueWithCredits,
  canPayContinueWithRewarded,
  continueCreditsPrice,
  continueCrystalsPrice,
  PRICES,
  type ContinuePaymentMethod,
} from '../../game/monetization/economy'
import { useWallet } from '../../game/monetization/useWallet'
import { Button } from '../../shared/ui'

export type LoseContinueModalProps = {
  limitMode: 'moves' | 'time'
  continueIndex: number
  onContinue: (method: ContinuePaymentMethod) => void
  onQuit: () => void
  /** Демо на странице Premium без колбэков оплаты */
  demo?: boolean
  className?: string
}

export function LoseContinueModal({
  limitMode,
  continueIndex,
  onContinue,
  onQuit,
  demo = false,
  className = '',
}: LoseContinueModalProps) {
  const { wallet } = useWallet()
  const idx = Math.max(1, continueIndex + 1)
  const creditsPrice = continueCreditsPrice(idx)
  const crystalsPrice = continueCrystalsPrice(idx)
  const movesLabel =
    limitMode === 'moves'
      ? `+${PRICES.continue.movesGrant} ходов`
      : `+${PRICES.continue.secondsGrant} сек`
  const rewardedLabel =
    limitMode === 'moves'
      ? `+${PRICES.continue.rewardedMoves} хода`
      : `+${PRICES.continue.secondsGrant} сек`

  const creditsAvailable = canPayContinueWithCredits()
  const rewardedAvailable = canPayContinueWithRewarded()

  return (
    <section
      className={`premium-card premium-modal-stub premium-lose-continue ${className}`.trim()}
      role="dialog"
      aria-labelledby="lose-continue-title">
      <div className="premium-card__header">
        <h2 id="lose-continue-title">Ещё один шанс?</h2>
        {!demo ? (
          <span className="premium-chip">Продолжение {idx}</span>
        ) : (
          <span className="premium-chip">UI-заготовка</span>
        )}
      </div>
      <p className="premium-muted">
        {demo
          ? 'Вы проиграли. Выберите вариант продолжения (демо-компоновка).'
          : 'Ходы или время закончились. Продолжите партию или завершите попытку.'}
      </p>
      <div className="premium-meta-row">
        <span className="premium-soft-note">
          Баланс: {wallet.credits} кр. · {wallet.crystals} крист.
        </span>
        <span className="premium-soft-note">
          Продолжений в попытке: {continueIndex}
        </span>
      </div>
      <div className="premium-grid premium-grid--3">
        <article className="premium-offer-card">
          <div className="premium-offer-card__top">
            <h3>{movesLabel}</h3>
            <span className="premium-price-badge premium-price-badge--discount">
              {creditsAvailable ? 'Скидка' : 'Лимит'}
            </span>
          </div>
          <p className="premium-muted">Оплата мягкой валютой</p>
          <p className="premium-offer-price">{creditsPrice} кредитов</p>
          <Button
            variant="primary"
            disabled={!demo && !creditsAvailable}
            onClick={() => onContinue('credits')}>
            {creditsAvailable ? 'Продолжить за кредиты' : 'Лимит на сегодня'}
          </Button>
        </article>
        <article className="premium-offer-card">
          <div className="premium-offer-card__top">
            <h3>
              {movesLabel}
              {limitMode === 'moves' ? ' + бустер' : ''}
            </h3>
            <span className="premium-price-badge premium-price-badge--premium">
              Премиум
            </span>
          </div>
          <p className="premium-muted">Без дневного лимита</p>
          <p className="premium-offer-price">{crystalsPrice} кристаллов</p>
          <Button variant="outline" onClick={() => onContinue('crystals')}>
            Продолжить за кристаллы
          </Button>
        </article>
        <article className="premium-offer-card">
          <div className="premium-offer-card__top">
            <h3>{rewardedLabel}</h3>
            <span className="premium-price-badge premium-price-badge--new">
              {rewardedAvailable ? 'Видео' : 'Лимит'}
            </span>
          </div>
          <p className="premium-muted">Rewarded video (демо без рекламы)</p>
          <p className="premium-offer-price">~30 сек</p>
          <Button
            variant="flat"
            disabled={!demo && !rewardedAvailable}
            onClick={() => onContinue('rewarded')}>
            {rewardedAvailable ? 'Смотреть видео' : 'Лимит на сегодня'}
          </Button>
        </article>
      </div>
      <div className="premium-stack premium-stack--row">
        <Button variant="outline" onClick={onQuit}>
          Выйти
        </Button>
        {!demo ? (
          <span className="premium-soft-note">
            Цена за кредиты растёт при повторном продолжении в одной попытке
          </span>
        ) : (
          <span className="premium-soft-note">
            Модалка-демо: на странице игры логика подключена
          </span>
        )}
      </div>
    </section>
  )
}
