import React from 'react'

import { Button } from '../../shared/ui'

export const ClanHubStub: React.FC = () => {
  return (
    <section className="premium-card">
      <div className="premium-card__header">
        <h2>Хаб кланов (заготовка)</h2>
        <span className="premium-chip">
          UI-заготовка
        </span>
      </div>
      <div className="premium-meta-row">
        <span className="premium-soft-note">
          Участников онлайн: 142
        </span>
        <span className="premium-soft-note">
          Клановый сезон: 9 дней
        </span>
      </div>
      <div className="premium-grid premium-grid--3">
        <div className="premium-panel">
          <div className="premium-panel__header">
            <h3>Клан</h3>
            <span className="premium-price-badge premium-price-badge--new">
              Новинка
            </span>
          </div>
          <p className="premium-muted">
            Создать или вступить в клан.
          </p>
          <ul>
            <li>Вступление: бесплатно</li>
            <li>Создание: 2500 кредитов</li>
            <li>Смена названия: 80 кристаллов</li>
          </ul>
          <div className="premium-stack">
            <Button variant="primary">
              Создать клан
            </Button>
            <Button variant="outline">
              Вступить по коду
            </Button>
          </div>
        </div>
        <div className="premium-panel">
          <div className="premium-panel__header">
            <h3>Клановые квесты</h3>
            <span className="premium-price-badge premium-price-badge--limited">
              Лимит
            </span>
          </div>
          <ul>
            <li>Собрать 500 красных фишек</li>
            <li>Активировать 20 бустеров</li>
            <li>Пройти 30 уровней кланом</li>
          </ul>
          <Button variant="outline">
            Показать награды
          </Button>
        </div>
        <div className="premium-panel">
          <div className="premium-panel__header">
            <h3>Клановая косметика</h3>
            <span className="premium-price-badge premium-price-badge--premium">
              Премиум
            </span>
          </div>
          <ul>
            <li>
              Эмблема клана - 120 кристаллов
            </li>
            <li>Баннер сезона - 80 кристаллов</li>
            <li>Рамка профиля - 60 кристаллов</li>
          </ul>
          <Button variant="flat">
            Открыть витрину
          </Button>
        </div>
      </div>
    </section>
  )
}
