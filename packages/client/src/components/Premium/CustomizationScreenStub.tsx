import React from 'react'

import { Button } from '../../shared/ui'

export const CustomizationScreenStub: React.FC =
  () => {
    return (
      <section className="premium-card">
        <div className="premium-card__header">
          <h2>Настройка клана (заготовка)</h2>
          <span className="premium-chip">
            Draft UI
          </span>
        </div>
        <div className="premium-grid premium-grid--2">
          <div className="premium-panel">
            <h3>Категории</h3>
            <ul>
              <li>Персонаж</li>
              <li>Оформление поля</li>
              <li>Спецэффекты</li>
              <li>Профиль и рамки</li>
            </ul>
          </div>
          <div className="premium-panel">
            <h3>Предпросмотр</h3>
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
            </div>
          </div>
        </div>
      </section>
    )
  }
