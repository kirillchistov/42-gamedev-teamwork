// Блок "О проекте" на лендинге с описанием преимуществ игры
import React from 'react'

export const Benefits: React.FC = () => {
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
          <div
            className="benefits__card"
            id="benefit-card">
            <h3>Понятный старт и прогресс</h3>
            <p>
              В текущей версии доступен
              классический match‑3 геймплей, в
              планах — бустеры, расширенные цели,
              соревнования и тематические
              спецэффекты.
            </p>
          </div>
          <div className="benefits__controls">
            <button
              type="button"
              id="benefit-prev">
              ‹
            </button>
            <div
              className="benefits__dots"
              id="benefit-dots"
            />
            <button
              type="button"
              id="benefit-next">
              ›
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}
