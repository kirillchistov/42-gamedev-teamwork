// Заглушка для игрового поля
import React from 'react'
import { Helmet } from 'react-helmet'

import { Header } from '../components/Header'
import { Footer } from '../components/Footer'
import { usePage } from '../hooks/usePage'
// import { PageInitArgs } from '../routes'

export const GamePage: React.FC = () => {
  usePage({ initPage: initGamePage })

  return (
    <div className="landing landing--light-flat">
      <Helmet>
        <meta charSet="utf-8" />
        <title>Cosmic Match — Игра</title>
        <meta
          name="description"
          content="Игровое поле Cosmic Match: match‑3 в космосе."
        />
      </Helmet>

      <Header />

      <main className="auth-main">
        <div className="auth-card auth-card--wide">
          <h1>Игровое поле Cosmic Match</h1>
          <p className="auth-note">
            Здесь будет интеграция настоящего игрового движка. Пока это
            демо‑страница в одном стиле с лендингом.
          </p>

          <div className="extra-card" style={{ marginTop: 8 }}>
            <h3>Демо‑поле</h3>
            <p>
              Здесь будем рендерить настоящее поле 8×8, ходы и эффекты будут
              синхронизированы с бэкендом через middleware.
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}

// export const initGamePage = (_args: PageInitArgs) => {
//   // пока без запросов к бэкенду, просто резолвим промис для демонстрации
//   return Promise.resolve()
// }

export const initGamePage = () => Promise.resolve()
