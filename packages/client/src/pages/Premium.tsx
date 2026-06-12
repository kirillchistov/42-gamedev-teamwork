import React from 'react'
import { Helmet } from 'react-helmet'

import { Header } from '../components/Header'
import { Footer } from '../components/Footer'
import { usePage } from '../hooks/usePage'
import { useLandingTheme } from '../contexts/LandingThemeContext'
import { ClanHubStub } from '../components/Premium/ClanHubStub'
import { CustomBgUnlockPanel } from '../components/Premium/CustomBgUnlockPanel'
import { CustomizationScreenStub } from '../components/Premium/CustomizationScreenStub'
import { FeatureRequestForm } from '../components/Premium/FeatureRequestForm'
import { LoseContinueModal } from '../components/Premium/LoseContinueModal'
import { SeasonPassStub } from '../components/Premium/SeasonPassStub'
import { ShopScreen } from '../components/Premium/ShopScreen'
import { WalletBar } from '../components/Premium/WalletBar'
import '../shared/styles/premium.pcss'

export function PremiumPage() {
  usePage({ initPage: initPremiumPage })
  const { theme } = useLandingTheme()
  const [bgDraft, setBgDraft] = React.useState('')
  const [toast, setToast] = React.useState('')

  return (
    <div className={`landing landing--${theme} premium-page`}>
      <Helmet>
        <meta charSet="utf-8" />
        <title>Демо-страница про монетизацию</title>
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
            Локальная демо-экономика: кредиты, кристаллы, продолжение после
            поражения, платные подсказки и кастомизация.
          </p>
          <WalletBar />
          {toast ? <p className="premium-toast">{toast}</p> : null}
        </section>

        <LoseContinueModal
          demo
          limitMode="moves"
          continueIndex={0}
          onContinue={() => setToast('Демо: оплата продолжения')}
          onQuit={() => setToast('Демо: выход из модалки')}
        />
        <ShopScreen onToast={setToast} />
        <CustomBgUnlockPanel
          urlDraft={bgDraft}
          onUrlDraftChange={setBgDraft}
          onApplied={setToast}
        />
        <FeatureRequestForm onSubmitted={setToast} />
        <ClanHubStub />
        <CustomizationScreenStub />
        <SeasonPassStub />
      </main>

      <Footer />
    </div>
  )
}

export const initPremiumPage = () => Promise.resolve()
