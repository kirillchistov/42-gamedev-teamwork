// Общий футер для всех страниц
import React from 'react'

export const Footer: React.FC = () => {
  return (
    <footer className="landing-footer">
      <div className="landing-footer__inner">
        <span>Team 42 © 2026 Cosmic Match</span>
        <span>Учебный проект браузерной игры «3 в ряд»</span>
      </div>
    </footer>
  )
}

export default Footer
