// import { Link } from 'react-router-dom'

// export const Header = () => {
//   return (
//     <nav>
//       <ul>
//         <li>
//           <Link to="/">Главная</Link>
//         </li>
//         <li>
//           <Link to="/friends">Страница со списком друзей</Link>
//         </li>
//         <li>
//           <Link to="/404">404</Link>
//         </li>
//       </ul>
//     </nav>
//   )
// }

// Общий хедер лендинга, который включает в себя навигацию, переключатель тем и бургер-меню
import React, { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

type LandingTheme = 'light-flat' | 'light-3d' | 'dark-neon'

const themeClassByValue: Record<LandingTheme, string> = {
  'light-flat': 'landing--light-flat',
  'light-3d': 'landing--light-3d',
  'dark-neon': 'landing--dark-neon',
}

// const SCROLL_TARGETS = ['how-to-play', 'about', 'team', 'contact'] as const;

export const Header: React.FC = () => {
  const [theme, setTheme] = useState<LandingTheme>('light-flat')
  const [mobileOpen, setMobileOpen] = useState(false)

  // навешиваем класс темы на корневой контейнер лендинга
  useEffect(() => {
    const root = document.getElementById('landing-root')
    if (!root) return

    root.classList.remove(
      'landing--light-flat',
      'landing--light-3d',
      'landing--dark-neon'
    )
    root.classList.add(themeClassByValue[theme])
  }, [theme])

  const scrollToSection = useCallback((id: string) => {
    const el = document.getElementById(id)
    if (!el) return
    el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    setMobileOpen(false)
  }, [])

  const handleThemeClick = (value: LandingTheme) => {
    setTheme(value)
  }

  return (
    <header className="landing-header">
      <div className="landing-header__inner">
        <div className="landing-header__left">
          <div className="landing-logo">
            <Link className="btn btn--flat" to="/">
              <span className="landing-logo__icon" />
              <span className="landing-logo__text">Cosmic Match</span>
            </Link>
          </div>
        </div>

        {/* Desktop nav */}
        <nav className="landing-nav landing-nav--desktop">
          <Link className="btn btn--flat" to="/game">
            Игра
          </Link>
          <Link className="btn btn--flat" to="/profile">
            Профиль
          </Link>
          <Link className="btn btn--flat" to="/leaderboard">
            Лидеры
          </Link>
          <Link className="btn btn--flat" to="/forum">
            Форум
          </Link>
          <Link className="btn btn--flat" to="/login">
            Вход
          </Link>
        </nav>

        <div className="landing-header__right">
          {/* Theme switch */}
          <div className="landing-theme-switch">
            <button
              type="button"
              className={
                'landing-theme-switch__btn' +
                (theme === 'light-flat' ? ' is-active' : '')
              }
              data-theme="light-flat"
              title="Светлая минималистичная"
              onClick={() => handleThemeClick('light-flat')}>
              ☀
            </button>
            <button
              type="button"
              className={
                'landing-theme-switch__btn' +
                (theme === 'light-3d' ? ' is-active' : '')
              }
              data-theme="light-3d"
              title="Светлая 3D"
              onClick={() => handleThemeClick('light-3d')}>
              ✨
            </button>
            <button
              type="button"
              className={
                'landing-theme-switch__btn' +
                (theme === 'dark-neon' ? ' is-active' : '')
              }
              data-theme="dark-neon"
              title="Тёмная неоновая"
              onClick={() => handleThemeClick('dark-neon')}>
              🌙
            </button>
          </div>

          {/* Burger */}
          <button
            type="button"
            className={`landing-burger ${mobileOpen ? 'is-open' : ''}`}
            id="burger"
            aria-label={mobileOpen ? 'Закрыть меню' : 'Открыть меню'}
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen(v => !v)}>
            <span />
            <span />
            <span />
          </button>
        </div>
      </div>

      {/* Mobile nav */}
      <nav
        className={
          'landing-nav landing-nav--mobile' +
          (mobileOpen ? ' landing-nav--mobile-open' : '')
        }
        id="mobile-nav">
        <Link className="btn btn--outline" to="/">
          Главная
        </Link>
        <Link className="btn btn--outline" to="/game">
          Игра
        </Link>
        <Link className="btn btn--outline" to="/profile">
          Профиль
        </Link>
        <Link className="btn btn--outline" to="/leaderboard">
          Лидеры
        </Link>
        <Link className="btn btn--outline" to="/forum">
          Форум
        </Link>
        <Link className="btn btn--outline" to="/forum-topic">
          Топик
        </Link>
        <Link className="btn btn--outline" to="/login">
          Вход
        </Link>
        <Link className="btn btn--outline" to="/signup">
          Регистрация
        </Link>
      </nav>
    </header>
  )
}

export default Header
