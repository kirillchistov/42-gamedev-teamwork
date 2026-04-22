import React from 'react'

import { Button } from '../../shared/ui'

const continueOffers = [
  {
    id: 'credits',
    title: '+5 ходов',
    subtitle: 'Оплата мягкой валютой',
    price: '900 кредитов',
    badge: 'Скидка',
    badgeKind: 'discount',
    cta: 'Продолжить за кредиты',
    variant: 'primary' as const,
  },
  {
    id: 'crystals',
    title: '+5 ходов + 1 бустер',
    subtitle: 'Премиум спас-пакет',
    price: '60 кристаллов',
    badge: 'Премиум',
    badgeKind: 'premium',
    cta: 'Продолжить за кристаллы',
    variant: 'outline' as const,
  },
  {
    id: 'video',
    title: '+3 хода',
    subtitle: 'Один раз за попытку',
    price: '1 rewarded video (~30 сек)',
    badge: 'Новинка',
    badgeKind: 'new',
    cta: 'Смотреть видео',
    variant: 'flat' as const,
  },
]

export const LoseContinueModal: React.FC = () => {
  return (
    <section className="premium-card premium-modal-stub">
      <div className="premium-card__header">
        <h2>
          Мини-спас при поражении (заготовка)
        </h2>
        <span className="premium-chip">
          UI-заготовка
        </span>
      </div>
      <p className="premium-muted">
        Вы проиграли. Выберите вариант продолжения
        (без реальной логики).
      </p>
      <div className="premium-meta-row">
        <span className="premium-soft-note">
          Серия поражений: 1
        </span>
        <span className="premium-soft-note">
          До авто-ресета цены: 07:12
        </span>
      </div>
      <div className="premium-grid premium-grid--3">
        {continueOffers.map(offer => (
          <article
            key={offer.id}
            className="premium-offer-card">
            <div className="premium-offer-card__top">
              <h3>{offer.title}</h3>
              <span
                className={`premium-price-badge premium-price-badge--${offer.badgeKind}`}>
                {offer.badge}
              </span>
            </div>
            <p className="premium-muted">
              {offer.subtitle}
            </p>
            <p className="premium-offer-price">
              {offer.price}
            </p>
            <Button variant={offer.variant}>
              {offer.cta}
            </Button>
          </article>
        ))}
      </div>
      <div className="premium-stack premium-stack--row">
        <Button variant="outline">Выйти</Button>
        <span className="premium-soft-note">
          Модалка-демо: таймер и обработка не
          подключены
        </span>
      </div>
    </section>
  )
}
