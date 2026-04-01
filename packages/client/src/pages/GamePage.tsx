import React, { useEffect, useState } from 'react'
import { Helmet } from 'react-helmet'
import {
  useLocation,
  useNavigate,
} from 'react-router-dom'

import { Header } from '../components/Header'
import { Footer } from '../components/Footer'
import { usePage } from '../hooks/usePage'
import { Match3Screen } from '../game/match3/Match3Screen'
import { useLandingTheme } from '../contexts/LandingThemeContext'

export const GamePage: React.FC = () => {
  usePage({ initPage: initGamePage })
  const { theme } = useLandingTheme()
  const [showSettings, setShowSettings] =
    useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const notice = (
    location.state as { notice?: string } | null
  )?.notice

  useEffect(() => {
    if (!notice) return
    navigate(location.pathname, {
      replace: true,
      state: null,
    })
  }, [notice, navigate, location.pathname])

  return (
    <div className={`landing landing--${theme}`}>
      <Helmet>
        <meta charSet="utf-8" />
        <title>Cosmic Match</title>
        <meta
          name="description"
          content="Игровое поле Cosmic Match."
        />
      </Helmet>

      <Header />

      <main className="auth-main">
        <div className="auth-card auth-card--wide">
          {notice && (
            <p
              className="auth-note"
              style={{
                marginBottom: 8,
                color:
                  'var(--color-accent-primary)',
                textAlign: 'center',
              }}>
              {notice}
            </p>
          )}
          <h1 style={{ textAlign: 'center' }}>
            Cosmic Match
          </h1>
          <p
            className="auth-note"
            style={{ textAlign: 'center' }}>
            Режим match-3: собирай комбинации,
            набирай очки, побеждай время.{' '}
            <button
              type="button"
              onClick={() =>
                setShowSettings(v => !v)
              }
              style={{
                border: 'none',
                background: 'transparent',
                color:
                  'var(--color-accent-primary)',
                textDecoration: 'underline',
                cursor: 'pointer',
                padding: 0,
                font: 'inherit',
              }}>
              Настроить
            </button>
          </p>

          {showSettings && (
            <div
              style={{
                margin: '12px auto 16px',
                maxWidth: 560,
                display: 'grid',
                gap: 12,
                gridTemplateColumns:
                  'repeat(auto-fit, minmax(160px, 1fr))',
              }}>
              <label
                style={{
                  display: 'grid',
                  gap: 4,
                }}>
                Поле
                <select defaultValue="8x8">
                  <option value="8x8">8x8</option>
                  <option value="12x12" disabled>
                    12x12
                  </option>
                  <option value="16x16" disabled>
                    16x16
                  </option>
                </select>
              </label>

              <label
                style={{
                  display: 'grid',
                  gap: 4,
                }}>
                Тема
                <select defaultValue="standard">
                  <option value="standard">
                    Стандарт
                  </option>
                  <option value="space" disabled>
                    Космос
                  </option>
                  <option value="math" disabled>
                    Математика
                  </option>
                </select>
              </label>

              <label
                style={{
                  display: 'grid',
                  gap: 4,
                }}>
                Время
                <select defaultValue="5">
                  <option value="5">
                    5 минут
                  </option>
                  <option value="3" disabled>
                    3 минуты
                  </option>
                  <option value="10" disabled>
                    10 минут
                  </option>
                </select>
              </label>
            </div>
          )}

          <Match3Screen />
        </div>
      </main>

      <Footer />
    </div>
  )
}

export const initGamePage = () =>
  Promise.resolve()
