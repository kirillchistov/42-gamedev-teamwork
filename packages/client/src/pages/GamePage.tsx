import React from 'react'
import { Helmet } from 'react-helmet'

import { Header } from '../components/Header'
import { Footer } from '../components/Footer'
import { usePage } from '../hooks/usePage'
import { Match3Screen } from '../game/match3/Match3Screen'

export const GamePage: React.FC = () => {
  usePage({ initPage: initGamePage })

  return (
    <div className="landing landing--light-flat">
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
          <h1>Cosmic Match</h1>
          <p className="auth-note">
            Режим match-3: собирай комбинации,
            набирай очки, побеждай время.
          </p>

          <Match3Screen />
        </div>
      </main>

      <Footer />
    </div>
  )
}

export const initGamePage = () =>
  Promise.resolve()
