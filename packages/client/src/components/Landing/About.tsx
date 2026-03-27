// Блок "О проекте" на лендинге с описанием преимуществ и навигацией по ним
import React from 'react'

export const About: React.FC = () => {
  return (
    <section className="section" id="about">
      <h2>Почему Cosmic Match</h2>
      <p className="section-subtitle">
        Учебный проект match‑3 в сеттинге космоса: понятный вход, глубокие
        механики и современный технологический стек.
      </p>
      <div className="benefits__inner">
        <div className="benefits__content">
          <div className="benefits__card" id="benefit-card">
            <h3>Простой вход</h3>
            <p>
              Геймплей понятен за секунды: меняй соседние фишки и собирай три в
              ряд.
            </p>
          </div>
          <div className="benefits__controls">
            <button type="button" id="benefit-prev">
              ‹
            </button>
            <div className="benefits__dots" id="benefit-dots" />
            <button type="button" id="benefit-next">
              ›
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}
