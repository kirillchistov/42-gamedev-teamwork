import React from 'react'

import { Button } from '../../shared/ui'

const sections = [
  {
    title: 'Бустеры',
    items: [
      'Ракета x1',
      'Бомба 3x3',
      'Перемешивание поля',
    ],
  },
  {
    title: 'Косметика',
    items: [
      'Скин персонажа "Nova"',
      'Тема поля "Nebula"',
      'Эффект матча "Comet Trail"',
    ],
  },
  {
    title: 'Наборы',
    items: [
      'Starter Pack',
      'Fail Rescue Pack',
      'Weekend Bundle',
    ],
  },
  {
    title: 'Pass',
    items: [
      'Free Track',
      'Premium Track',
      'Season Booster Pack',
    ],
  },
]

export const ShopScreen: React.FC = () => {
  return (
    <section className="premium-card">
      <div className="premium-card__header">
        <h2>Магазин артефактов (заготовка)</h2>
        <span className="premium-chip">
          Draft UI
        </span>
      </div>
      <div className="premium-grid premium-grid--2">
        {sections.map(section => (
          <article
            key={section.title}
            className="premium-panel">
            <h3>{section.title}</h3>
            <ul>
              {section.items.map(item => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <Button variant="outline">
              Открыть раздел
            </Button>
          </article>
        ))}
      </div>
    </section>
  )
}
