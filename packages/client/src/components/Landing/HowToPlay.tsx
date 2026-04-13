// Блок "Как играть" для лендинга, с кратким описанием механики и советами для новичков
import React from 'react'

export const HowToPlay: React.FC = () => {
  const cards = [
    {
      title: 'Создание комбинации',
      desc: 'Меняйте соседние фишки местами и собирайте линии 3+, чтобы запускать цепочки.',
      badge: '3x',
      screenText: 'Три одинаковых в ряд',
    },
    {
      title: 'Мега-комбо',
      desc: 'Длинные каскады ускоряют набор очков и дают мощный буст к итоговому результату.',
      badge: 'x8',
      screenText: 'Каскад + взрыв + бонус',
    },
    {
      title: 'Бустеры',
      desc: 'Линейные и зональные эффекты помогают закрывать сложные цели и выходить из тупиков.',
      badge: 'BOOST',
      screenText: 'Линия, крест и зона',
    },
    {
      title: 'Блокеры',
      desc: 'Спец-клетки и препятствия требуют точных ходов, чтобы не терять темп матча.',
      badge: 'LOCK',
      screenText: 'Лед, замки и барьеры',
    },
  ]

  return (
    <section className="section" id="how-to-play">
      <h2>Как играть</h2>
      <p className="section-subtitle">
        Короткий визуальный гайд по основным
        игровым ситуациям.
      </p>
      <div className="how-to-grid">
        {cards.map(card => (
          <article
            key={card.title}
            className="how-to-card">
            <div className="how-to-card__screen">
              <span className="how-to-card__badge">
                {card.badge}
              </span>
              <p>{card.screenText}</p>
            </div>
            <h3>{card.title}</h3>
            <p>{card.desc}</p>
          </article>
        ))}
      </div>
    </section>
  )
}
