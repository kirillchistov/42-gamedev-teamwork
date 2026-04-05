// Общий хедер лендинга, который включает в себя навигацию, переключатель тем и бургер-меню
/** Изменения и починка Sprint6 Chores:
 * 1. Почистил закомментированный код
 * 2. Добавил /logout и др. пути в навигацию
 * 3. Добавил проверку сессии и переключатель Вход/Выход
 * 4. Поправил фон и поведение мобильного меню
 **/
import React, {
  useCallback,
  useEffect,
  useState,
} from 'react'
import { Link } from 'react-router-dom'
import {
  type LandingTheme,
  useLandingTheme,
} from '../../contexts/LandingThemeContext'
import { useSelector } from '../../store'
import { selectUser } from '../../slices/userSlice'

export const Header: React.FC = () => {
  const { theme, setTheme } = useLandingTheme()
  const user = useSelector(selectUser)
  const [mobileOpen, setMobileOpen] =
    useState(false)

  const closeMobile = useCallback(() => {
    setMobileOpen(false)
  }, [])

  const handleThemeClick = (
    value: LandingTheme
  ) => {
    setTheme(value)
    // Закрываем выезжающее меню при переключении темы
    if (mobileOpen) closeMobile()
  }

  useEffect(() => {
    if (!mobileOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeMobile()
    }
    window.addEventListener('keydown', onKey)
    return () =>
      window.removeEventListener('keydown', onKey)
  }, [mobileOpen, closeMobile])

  return (
    <header className="landing-header">
      <div className="landing-header__inner">
        <div className="landing-header__left">
          <div className="landing-logo">
            <Link
              className="btn btn--flat"
              to="/"
              onClick={closeMobile}>
              <span className="landing-logo__icon" />
              <span className="landing-logo__text">
                Cosmic Match
              </span>
            </Link>
          </div>
        </div>

        {/* Desktop nav */}
        <nav className="landing-nav landing-nav--desktop">
          <Link
            className="btn btn--flat"
            to="/game">
            Игра
          </Link>
          <Link
            className="btn btn--flat"
            to="/profile">
            Профиль
          </Link>
          <Link
            className="btn btn--flat"
            to="/leaderboard">
            Лидеры
          </Link>
          <Link
            className="btn btn--flat"
            to="/forum">
            Форум
          </Link>
          {user ? (
            <Link
              className="btn btn--flat"
              to="/logout">
              Выход
            </Link>
          ) : (
            <Link
              className="btn btn--flat"
              to="/login">
              Вход
            </Link>
          )}
        </nav>

        <div className="landing-header__right">
          {/* Theme switch */}
          <div className="landing-theme-switch">
            <button
              type="button"
              className={
                'landing-theme-switch__btn' +
                (theme === 'light-flat'
                  ? ' is-active'
                  : '')
              }
              data-theme="light-flat"
              title="Светлая минималистичная"
              onClick={() =>
                handleThemeClick('light-flat')
              }>
              ☀
            </button>
            <button
              type="button"
              className={
                'landing-theme-switch__btn' +
                (theme === 'light-3d'
                  ? ' is-active'
                  : '')
              }
              data-theme="light-3d"
              title="Светлая 3D"
              onClick={() =>
                handleThemeClick('light-3d')
              }>
              ✨
            </button>
            <button
              type="button"
              className={
                'landing-theme-switch__btn' +
                (theme === 'dark-neon'
                  ? ' is-active'
                  : '')
              }
              data-theme="dark-neon"
              title="Тёмная неоновая"
              onClick={() =>
                handleThemeClick('dark-neon')
              }>
              🌙
            </button>
          </div>

          {/* Burger */}
          <button
            type="button"
            className={`landing-burger ${
              mobileOpen ? 'is-open' : ''
            }`}
            id="burger"
            aria-label={
              mobileOpen
                ? 'Закрыть меню'
                : 'Открыть меню'
            }
            aria-expanded={mobileOpen}
            onClick={() =>
              setMobileOpen(v => !v)
            }>
            <span />
            <span />
            <span />
          </button>
        </div>
      </div>

      {/* Клик по затемнению — закрыть меню (см. pcss) */}
      {mobileOpen ? (
        <button
          type="button"
          className="landing-nav-backdrop"
          aria-label="Закрыть меню"
          onClick={closeMobile}
        />
      ) : null}

      {/* Mobile nav */}
      <nav
        className={
          'landing-nav landing-nav--mobile' +
          (mobileOpen
            ? ' landing-nav--mobile-open'
            : '')
        }
        id="mobile-nav"
        aria-hidden={!mobileOpen}>
        <Link
          className="btn btn--outline"
          to="/"
          onClick={closeMobile}>
          Лендинг
        </Link>
        <Link
          className="btn btn--outline"
          to="/game"
          onClick={closeMobile}>
          Игра
        </Link>
        <Link
          className="btn btn--outline"
          to="/profile"
          onClick={closeMobile}>
          Профиль
        </Link>
        <Link
          className="btn btn--outline"
          to="/leaderboard"
          onClick={closeMobile}>
          Лидеры
        </Link>
        <Link
          className="btn btn--outline"
          to="/forum"
          onClick={closeMobile}>
          Форум
        </Link>
        <Link
          className="btn btn--outline"
          to="/forum-topic"
          onClick={closeMobile}>
          Топик
        </Link>
        {user ? (
          <Link
            className="btn btn--outline"
            to="/logout"
            onClick={closeMobile}>
            Выход
          </Link>
        ) : (
          <>
            <Link
              className="btn btn--outline"
              to="/login"
              onClick={closeMobile}>
              Вход
            </Link>
            <Link
              className="btn btn--outline"
              to="/signup"
              onClick={closeMobile}>
              Регистрация
            </Link>
          </>
        )}
      </nav>
    </header>
  )
}

export default Header
