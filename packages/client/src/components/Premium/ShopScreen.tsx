import React from 'react'

import { Button } from '../../shared/ui'

const sections = [
  {
    title: 'Бустеры',
    items: [
      {
        name: 'Ракета x3',
        price: '320 credits',
        badge: 'Скидка',
        badgeKind: 'discount',
      },
      {
        name: 'Бомба 3x3 x2',
        price: '35 crystals',
        badge: 'Премиум',
        badgeKind: 'premium',
      },
      {
        name: 'Перемешивание x1',
        price: '220 credits',
        badge: 'Новинка',
        badgeKind: 'new',
      },
    ],
  },
  {
    title: 'Косметика',
    items: [
      {
        name: 'Скин "Nova Pilot"',
        price: '180 crystals',
        badge: 'Премиум',
        badgeKind: 'premium',
      },
      {
        name: 'Тема поля "Nebula"',
        price: '120 crystals',
        badge: 'Скидка',
        badgeKind: 'discount',
      },
      {
        name: 'VFX "Comet Trail"',
        price: '70 crystals',
        badge: 'Новинка',
        badgeKind: 'new',
      },
    ],
  },
  {
    title: 'Наборы',
    items: [
      {
        name: 'Стартовый набор',
        price: '149 ₽',
        badge: 'Скидка',
        badgeKind: 'discount',
      },
      {
        name: 'Набор после поражения',
        price: '99 ₽',
        badge: 'Лимит',
        badgeKind: 'limited',
      },
      {
        name: 'Набор выходного дня',
        price: '249 ₽',
        badge: 'Лимит',
        badgeKind: 'limited',
      },
    ],
  },
  {
    title: 'Пропуск',
    items: [
      {
        name: 'Сезонный пропуск',
        price: '499 ₽ / 30 дней',
        badge: 'Премиум',
        badgeKind: 'premium',
      },
      {
        name: 'Премиум Плюс',
        price: '799 ₽ / 30 дней',
        badge: 'Премиум',
        badgeKind: 'premium',
      },
      {
        name: 'Бустер прогресса',
        price: '99 ₽',
        badge: 'Новинка',
        badgeKind: 'new',
      },
    ],
  },
]

export const ShopScreen: React.FC = () => {
  return (
    <section className="premium-card">
      <div className="premium-card__header">
        <h2>Магазин артефактов (заготовка)</h2>
        <span className="premium-chip">
          UI-заготовка
        </span>
      </div>
      <div className="premium-grid premium-grid--2">
        {sections.map(section => (
          <article
            key={section.title}
            className="premium-panel">
            <div className="premium-panel__header">
              <h3>{section.title}</h3>
              <span className="premium-soft-note">
                3 оффера
              </span>
            </div>
            <ul className="premium-offer-list">
              {section.items.map(item => (
                <li
                  key={`${section.title}-${item.name}`}
                  className="premium-offer-row">
                  <div>
                    <div>{item.name}</div>
                    <div className="premium-soft-note">
                      {item.price}
                    </div>
                  </div>
                  <span
                    className={`premium-price-badge premium-price-badge--${item.badgeKind}`}>
                    {item.badge}
                  </span>
                </li>
              ))}
            </ul>
            <div className="premium-stack premium-stack--row">
              <Button variant="outline">
                Открыть раздел
              </Button>
              <Button variant="flat">
                Подробнее
              </Button>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
