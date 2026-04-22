import React from 'react'

import { Button } from '../../shared/ui'

export const ClanHubStub: React.FC = () => {
  return (
    <section className="premium-card">
      <div className="premium-card__header">
        <h2>Хаб кланов (заготовка)</h2>
        <span className="premium-chip">
          Draft UI
        </span>
      </div>
      <div className="premium-grid premium-grid--3">
        <div className="premium-panel">
          <h3>Клан</h3>
          <p className="premium-muted">
            Создать или вступить в клан.
          </p>
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
          <h3>Клановые квесты</h3>
          <ul>
            <li>Собрать 500 красных фишек</li>
            <li>Активировать 20 бустеров</li>
            <li>Пройти 30 уровней кланом</li>
          </ul>
        </div>
        <div className="premium-panel">
          <h3>Клановая косметика</h3>
          <ul>
            <li>Эмблема клана</li>
            <li>Баннер сезона</li>
            <li>Рамка профиля</li>
          </ul>
        </div>
      </div>
    </section>
  )
}
