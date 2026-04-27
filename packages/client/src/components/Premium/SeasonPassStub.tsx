import React from 'react'

import { Button } from '../../shared/ui'

const freeTrack = [
  {
    tier: 'T1',
    reward: '50 кредитов',
    status: 'Получено',
  },
  {
    tier: 'T2',
    reward: 'Ракета x1',
    status: 'Доступно',
  },
  {
    tier: 'T3',
    reward: 'Рамка аватара',
    status: 'Заблокировано',
  },
  {
    tier: 'T4',
    reward: '150 кредитов',
    status: 'Заблокировано',
  },
]

const premiumTrack = [
  {
    tier: 'T1',
    reward: '300 кристаллов',
    status: 'Премиум',
  },
  {
    tier: 'T2',
    reward: 'Эпический скин',
    status: 'Премиум',
  },
  {
    tier: 'T3',
    reward: 'Бомба x3',
    status: 'Премиум',
  },
  {
    tier: 'T4',
    reward: 'Сезонный финишер FX',
    status: 'Премиум',
  },
]

export const SeasonPassStub: React.FC = () => {
  return (
    <section className="premium-card">
      <div className="premium-card__header">
        <h2>Проездной (заготовка)</h2>
        <span className="premium-chip">
          UI-заготовка
        </span>
      </div>
      <div className="premium-meta-row">
        <span className="premium-soft-note">
          Прогресс сезона: 18 / 60
        </span>
        <span className="premium-soft-note">
          До конца: 12 дней
        </span>
      </div>
      <div className="premium-grid premium-grid--2">
        <article className="premium-panel">
          <div className="premium-panel__header">
            <h3>Проездной эконом</h3>
            <span className="premium-price-badge premium-price-badge--new">
              Новинка
            </span>
          </div>
          <ol className="premium-offer-list">
            {freeTrack.map(item => (
              <li
                key={`${item.tier}-${item.reward}`}
                className="premium-offer-row">
                <div>
                  <div>
                    {item.tier}: {item.reward}
                  </div>
                </div>
                <span className="premium-soft-note">
                  {item.status}
                </span>
              </li>
            ))}
          </ol>
        </article>
        <article className="premium-panel">
          <div className="premium-panel__header">
            <h3>Проездной премиум</h3>
            <span className="premium-price-badge premium-price-badge--premium">
              499 ₽
            </span>
          </div>
          <ol className="premium-offer-list">
            {premiumTrack.map(item => (
              <li
                key={`${item.tier}-${item.reward}`}
                className="premium-offer-row">
                <div>
                  <div>
                    {item.tier}: {item.reward}
                  </div>
                </div>
                <span className="premium-soft-note">
                  {item.status}
                </span>
              </li>
            ))}
          </ol>
        </article>
      </div>
      <div className="premium-stack premium-stack--row">
        <Button variant="primary">
          Купить премиум-пропуск
        </Button>
        <Button variant="outline">
          Показать все награды
        </Button>
      </div>
    </section>
  )
}
