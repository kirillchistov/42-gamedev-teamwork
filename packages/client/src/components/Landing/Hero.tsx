// Главный блок лендинга с заголовком, описанием и кнопками
// client/src/components/Landing/Hero.tsx
import React from 'react'
import { Link } from 'react-router-dom'
import { useSelector } from '../../store'
import { selectUser } from '../../slices/userSlice'
import { HeroMiniBoard } from './HeroMiniBoard'
import { HeroVisualOrbit } from './HeroVisualOrbit'

type HeroProps = {
  onOpenPresentation?: () => void
}

export function Hero({ onOpenPresentation }: HeroProps) {
  const user = useSelector(selectUser)
  const ctaLink = user ? '/profile' : '/signup'
  const ctaText = user ? 'Профиль' : 'Зарегистрироваться'

  return (
    <section className="hero" id="top-hero">
      <div className="hero__text">
        <h1>Cosmic Match с живой прогрессией</h1>
        <p>
          Уровни, цели и комбо‑каскады. Широкий выбор игровых и визуальных
          настроек. Выбирай своего персонажа и делай историю вместе с ним!
        </p>
        <div className="hero__actions">
          <Link className="btn btn--primary" to="/game">
            Перейти к игре
          </Link>
          <Link className="btn btn--outline" to={ctaLink}>
            {ctaText}
          </Link>
        </div>
      </div>

      <div className="hero__visual">
        <HeroVisualOrbit>
          <HeroMiniBoard
            asButton
            onClick={onOpenPresentation}
            showPresentationHint
            ariaLabel="Открыть презентацию проекта, около 7 минут"
          />
        </HeroVisualOrbit>
      </div>
    </section>
  )
}

export default Hero
