// Общий футер для всех страниц
import React from 'react'

export const Footer: React.FC = () => {
  return (
    <footer className="landing-footer">
      <div className="landing-footer__inner">
        <span>
          <span className="landing-footer__full">
            Team 42 © 2026 Cosmic Match
          </span>
          <span className="landing-footer__compact">
            Team 42 © 2026
          </span>
        </span>
        <span>
          <span className="landing-footer__full">
            Учебный проект браузерной игры «3 в
            ряд»
          </span>
          <span className="landing-footer__compact">
            Cosmic Match
          </span>
        </span>
      </div>
    </footer>
  )
}
