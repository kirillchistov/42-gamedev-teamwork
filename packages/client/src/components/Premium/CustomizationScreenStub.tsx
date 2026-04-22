import React from 'react'

import { Button } from '../../shared/ui'

const cosmeticCategories = [
  {
    name: 'Персонаж',
    rarity: 'Премиум',
    badgeKind: 'premium',
    price: '140 crystals',
  },
  {
    name: 'Оформление поля',
    rarity: 'Скидка',
    badgeKind: 'discount',
    price: '95 crystals',
  },
  {
    name: 'Спецэффекты',
    rarity: 'Лимит',
    badgeKind: 'limited',
    price: '180 crystals',
  },
  {
    name: 'Профиль и рамки',
    rarity: 'Новинка',
    badgeKind: 'new',
    price: '450 credits',
  },
]

export const CustomizationScreenStub: React.FC =
  () => {
    return (
      <section className="premium-card">
        <div className="premium-card__header">
          <h2>
            Кастомизация профиля (заготовка)
          </h2>
          <span className="premium-chip">
            UI-заготовка
          </span>
        </div>
        <div className="premium-meta-row">
          <span className="premium-soft-note">
            Активный пресет: Nebula Scout
          </span>
          <span className="premium-soft-note">
            Слоты пресетов: 2/5
          </span>
        </div>
        <div className="premium-grid premium-grid--2">
          <div className="premium-panel">
            <div className="premium-panel__header">
              <h3>Категории</h3>
              <span className="premium-price-badge premium-price-badge--premium">
                Премиум
              </span>
            </div>
            <ul className="premium-offer-list">
              {cosmeticCategories.map(item => (
                <li
                  key={item.name}
                  className="premium-offer-row">
                  <div>
                    <div>{item.name}</div>
                    <div className="premium-soft-note">
                      {item.price}
                    </div>
                  </div>
                  <span
                    className={`premium-price-badge premium-price-badge--${item.badgeKind}`}>
                    {item.rarity}
                  </span>
                </li>
              ))}
            </ul>
          </div>
          <div className="premium-panel">
            <div className="premium-panel__header">
              <h3>Предпросмотр</h3>
              <span className="premium-soft-note">
                Демо-макет
              </span>
            </div>
            <div className="premium-preview">
              Зона предпросмотра
            </div>
            <div className="premium-stack premium-stack--row">
              <Button variant="primary">
                Экипировать
              </Button>
              <Button variant="outline">
                Сохранить пресет
              </Button>
              <Button variant="flat">
                Купить слот пресета
              </Button>
            </div>
          </div>
        </div>
      </section>
    )
  }
