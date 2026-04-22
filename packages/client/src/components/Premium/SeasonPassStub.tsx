import React from 'react'

import { Button } from '../../shared/ui'

const freeTrack = [
  '50 credits',
  'Rocket x1',
  'Avatar frame',
  '150 credits',
]

const premiumTrack = [
  '300 crystals',
  'Epic skin',
  'Bomb x3',
  'Season finisher FX',
]

export const SeasonPassStub: React.FC = () => {
  return (
    <section className="premium-card">
      <div className="premium-card__header">
        <h2>Проездной (заготовка)</h2>
        <span className="premium-chip">
          Draft UI
        </span>
      </div>
      <div className="premium-grid premium-grid--2">
        <article className="premium-panel">
          <h3>Проездной эконом</h3>
          <ol>
            {freeTrack.map(item => (
              <li key={item}>{item}</li>
            ))}
          </ol>
        </article>
        <article className="premium-panel">
          <h3>Проездной премиум</h3>
          <ol>
            {premiumTrack.map(item => (
              <li key={item}>{item}</li>
            ))}
          </ol>
        </article>
      </div>
      <div className="premium-stack premium-stack--row">
        <Button variant="primary">
          Купить Премиум
        </Button>
        <Button variant="outline">
          Показать все награды
        </Button>
      </div>
    </section>
  )
}
