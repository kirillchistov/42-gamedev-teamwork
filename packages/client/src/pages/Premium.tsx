import React from 'react'
import { Helmet } from 'react-helmet'

import { Header } from '../components/Header'
import { Footer } from '../components/Footer'
import { usePage } from '../hooks/usePage'
import { useLandingTheme } from '../contexts/LandingThemeContext'
import { ClanHubStub } from '../components/Premium/ClanHubStub'
import { LoseContinueModal } from '../components/Premium/LoseContinueModal'
import { CustomizationScreenStub } from '../components/Premium/CustomizationScreenStub'
import { SeasonPassStub } from '../components/Premium/SeasonPassStub'
import { ShopScreen } from '../components/Premium/ShopScreen'

export const PremiumPage: React.FC = () => {
  usePage({ initPage: initPremiumPage })
  const { theme } = useLandingTheme()

  return (
    <div
      className={`landing landing--${theme} premium-page`}>
      <Helmet>
        <meta charSet="utf-8" />
        <title>
          Демо-страница про монетизацию
        </title>
        <meta
          name="description"
          content="Демо-страница UI-заготовок монетизации Cosmic Match."
        />
      </Helmet>

      <Header />

      <main className="premium-main">
        <section className="premium-hero premium-card">
          <h1>Демо-компоненты для монетизации</h1>
          <p className="premium-muted">
            Демо-компоновка экранов пока без
            бизнес-логики и API.
          </p>
        </section>

        <LoseContinueModal />
        <ShopScreen />
        <ClanHubStub />
        <CustomizationScreenStub />
        <SeasonPassStub />
      </main>

      <Footer />
    </div>
  )
}

export const initPremiumPage = () =>
  Promise.resolve()
