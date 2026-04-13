// Блок "О проекте" на лендинге с описанием преимуществ игры
import React, { useMemo, useState } from 'react'

export const Benefits: React.FC = () => {
  const items = useMemo(
    () => [
      {
        title: 'Понятный старт и прогресс',
        text: 'Уже на первой сессии видно рост: комбо, цели и рекорд в одном матче.',
      },
      {
        title: 'Живой темп матча',
        text: 'Каскады и спецэффекты добавляют динамику без сложного обучения.',
      },
      {
        title: 'Игра в коротких сессиях',
        text: 'Одна партия занимает несколько минут, удобно заходить между делами.',
      },
      {
        title: 'Ясные цели уровня',
        text: 'Игрок всегда понимает, что нужно сделать: очки, метки и прогресс по задачам.',
      },
      {
        title: 'Готовность к развитию',
        text: 'Архитектура уже подготовлена под бустеры, события и режим по ходам.',
      },
      {
        title: 'Работает в браузере',
        text: 'Ничего устанавливать не нужно: вход и запуск игры за пару кликов.',
      },
      {
        title: 'Командная соревновательность',
        text: 'Лидерборд и форум помогают обсуждать стратегии и сравнивать результаты.',
      },
      {
        title: 'Единый визуальный стиль',
        text: 'Тёмные и светлые темы поддерживают комфортную игру в любое время суток.',
      },
    ],
    []
  )
  const [current, setCurrent] = useState(0)
  const active = items[current]

  const goPrev = () => {
    setCurrent(prev =>
      prev === 0 ? items.length - 1 : prev - 1
    )
  }

  const goNext = () => {
    setCurrent(prev => (prev + 1) % items.length)
  }

  return (
    <section className="section" id="benefits">
      <h2>Преимущества Cosmic Match</h2>
      <p className="section-subtitle">
        Проект развивается как игровая платформа:
        быстрый вход, понятная прогрессия и
        расширяемая архитектура под новые
        механики.
      </p>
      <div className="benefits__inner">
        <div className="benefits__content">
          <div className="benefits__card">
            <h3>{active.title}</h3>
            <p>{active.text}</p>
          </div>
          <div className="benefits__controls">
            <button
              type="button"
              onClick={goPrev}
              aria-label="Предыдущее преимущество">
              ‹
            </button>
            <div className="benefits__dots">
              {items.map((item, index) => (
                <button
                  key={item.title}
                  type="button"
                  className={
                    'benefits__dot' +
                    (index === current
                      ? ' is-active'
                      : '')
                  }
                  aria-label={`Преимущество ${
                    index + 1
                  }`}
                  onClick={() =>
                    setCurrent(index)
                  }
                />
              ))}
            </div>
            <button
              type="button"
              onClick={goNext}
              aria-label="Следующее преимущество">
              ›
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}
