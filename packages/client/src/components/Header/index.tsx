// Общий хедер лендинга, который включает в себя навигацию, переключатель тем и бургер-меню
/** 6.0 Изменения и починка Sprint6 Chores:
 * Почистил закомментированный код
 * Добавил /logout и др. пути в навигацию
 * Добавил проверку сессии и переключатель Вход/Выход
 * Поправил фон и поведение мобильного меню
 * 6.3.2 Оболочка /game (полноэкран, компактная шапка, луна/солнце):
 * Убрал настройки игры при активном игровом поле
 * Добавил уровень игры в меню настроек в шапке
 * Props: variant 'default' | 'game', fullscreenTargetRef — только для страницы игры
 * variant=game: класс landing-header--game; одна кнопка темы 🌙/☀ → toggleColorMode()
 * Кнопка полноэкранного режима + SVG иконки; синхронизация состояния через addFullscreenChangeListener
 * (на остальных страницах — как раньше - трио: light-flat / light-3d / dark-neon).
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
import {
  addFullscreenChangeListener,
  getFullscreenElement,
  toggleFullscreen,
} from '../../utils/fullscreen'

export type HeaderVariant = 'default' | 'game'

export type HeaderProps = {
  variant?: HeaderVariant
  fullscreenTargetRef?: React.RefObject<HTMLElement | null>
  onOpenSettings?: () => void
}

function IconFullscreenEnter() {
  return (
    <svg
      width={18}
      height={18}
      viewBox="0 0 24 24"
      aria-hidden
      fill="currentColor">
      <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z" />
    </svg>
  )
}

function IconFullscreenExit() {
  return (
    <svg
      width={18}
      height={18}
      viewBox="0 0 24 24"
      aria-hidden
      fill="currentColor">
      <path d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z" />
    </svg>
  )
}

function IconSettings() {
  return (
    <svg
      width={18}
      height={18}
      viewBox="0 0 24 24"
      aria-hidden
      fill="currentColor">
      <path d="M19.14 12.94c.04-.31.06-.63.06-.94s-.02-.63-.06-.94l2.03-1.58a.5.5 0 0 0 .12-.64l-1.92-3.32a.5.5 0 0 0-.6-.22l-2.39.96a7.25 7.25 0 0 0-1.63-.94l-.36-2.54a.5.5 0 0 0-.49-.42h-3.84a.5.5 0 0 0-.49.42l-.36 2.54c-.58.22-1.13.53-1.63.94l-2.39-.96a.5.5 0 0 0-.6.22L2.71 8.84a.5.5 0 0 0 .12.64l2.03 1.58c-.04.31-.06.63-.06.94s.02.63.06.94L2.83 14.52a.5.5 0 0 0-.12.64l1.92 3.32a.5.5 0 0 0 .6.22l2.39-.96c.5.41 1.05.72 1.63.94l.36 2.54c.05.24.25.42.49.42h3.84c.24 0 .44-.18.49-.42l.36-2.54c.58-.22 1.13-.53 1.63-.94l2.39.96a.5.5 0 0 0 .6-.22l1.92-3.32a.5.5 0 0 0-.12-.64l-2.03-1.58zM12 15.5A3.5 3.5 0 1 1 12 8.5a3.5 3.5 0 0 1 0 7z" />
    </svg>
  )
}

export const Header: React.FC<HeaderProps> = ({
  variant = 'default',
  fullscreenTargetRef,
  onOpenSettings,
}) => {
  const { theme, setTheme, toggleColorMode } =
    useLandingTheme()
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

  const isGameVariant = variant === 'game'
  const [pageFs, setPageFs] = useState(false)

  useEffect(() => {
    if (!isGameVariant || !fullscreenTargetRef)
      return undefined
    const sync = () => {
      const shell = fullscreenTargetRef.current
      const active = getFullscreenElement()
      setPageFs(
        Boolean(shell && active === shell)
      )
    }
    sync()
    return addFullscreenChangeListener(sync)
  }, [isGameVariant, fullscreenTargetRef])

  const onFullscreenClick = useCallback(() => {
    if (!fullscreenTargetRef?.current) return
    void toggleFullscreen(
      fullscreenTargetRef.current
    )
  }, [fullscreenTargetRef])

  const headerClass =
    'landing-header' +
    (isGameVariant
      ? ' landing-header--game'
      : '') +
    (isGameVariant && pageFs ? ' is-fs' : '')

  return (
    <header className={headerClass}>
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
          {isGameVariant ? (
            <>
              <button
                type="button"
                className="landing-settings-btn"
                title="Настройки игры"
                aria-label="Открыть настройки игры"
                onClick={() => {
                  onOpenSettings?.()
                  if (mobileOpen) closeMobile()
                }}>
                <IconSettings />
              </button>
              <button
                type="button"
                className="landing-theme-toggle"
                title={
                  theme === 'dark-neon'
                    ? 'Светлая тема (солнце)'
                    : 'Тёмная тема (луна)'
                }
                aria-label={
                  theme === 'dark-neon'
                    ? 'Включить светлую тему'
                    : 'Включить тёмную тему'
                }
                onClick={() => {
                  toggleColorMode()
                  if (mobileOpen) closeMobile()
                }}>
                {theme === 'dark-neon' ? (
                  <span
                    className="landing-theme-toggle__glyph"
                    aria-hidden>
                    ☀
                  </span>
                ) : (
                  <span
                    className="landing-theme-toggle__glyph"
                    aria-hidden>
                    🌙
                  </span>
                )}
              </button>
              {fullscreenTargetRef ? (
                <button
                  type="button"
                  className="landing-fullscreen-btn"
                  title={
                    pageFs
                      ? 'Выйти из полноэкранного режима'
                      : 'Полноэкранный режим (клавиша F)'
                  }
                  aria-label={
                    pageFs
                      ? 'Выйти из полноэкранного режима'
                      : 'Включить полноэкранный режим'
                  }
                  aria-pressed={pageFs}
                  onClick={onFullscreenClick}>
                  {pageFs ? (
                    <IconFullscreenExit />
                  ) : (
                    <IconFullscreenEnter />
                  )}
                </button>
              ) : null}
            </>
          ) : (
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
          )}

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
        {user && onOpenSettings ? (
          <Link
            type="button"
            className="btn btn--outline"
            to="/game/settings"
            onClick={() => {
              onOpenSettings()
              closeMobile()
            }}>
            Настройки
          </Link>
        ) : null}
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
