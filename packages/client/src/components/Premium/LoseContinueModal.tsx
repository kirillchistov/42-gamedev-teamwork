import React from 'react'

import { Button } from '../../shared/ui'

export const LoseContinueModal: React.FC = () => {
  return (
    <section className="premium-card premium-modal-stub">
      <div className="premium-card__header">
        <h2>
          Мини-спас при поражении (заготовка)
        </h2>
        <span className="premium-chip">
          Draft UI
        </span>
      </div>
      <p className="premium-muted">
        Вы проиграли. Выберите вариант продолжения
        (без реальной логики).
      </p>
      <div className="premium-grid premium-grid--2">
        <Button variant="primary">
          +5 ходов (кредиты)
        </Button>
        <Button variant="outline">
          +5 ходов (кристаллы)
        </Button>
        <Button variant="flat">
          Смотреть видео
        </Button>
        <Button variant="outline">Выйти</Button>
      </div>
    </section>
  )
}
