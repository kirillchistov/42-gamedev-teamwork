// Ошибка 5xx - проблема на сервере
import { Helmet } from 'react-helmet'
import clsx from 'clsx'

import { Header } from '../components/Header'
import { Footer } from '../components/Footer'
import { usePage } from '../hooks/usePage'

export const Error500Page = () => {
  usePage({ initPage: initError500Page })

  return (
    <div className={clsx('landing', 'ErrorPage')}>
      <Helmet>
        <meta charSet="utf-8" />
        <title>Ошибка 500 — CosMatch</title>
        <meta name="description" content="Серверная ошибка 500" />
      </Helmet>

      <Header />

      <main className="auth-main">
        <div className="auth-card auth-card--wide error-card">
          <h1 className="error-title">
            500{' '}
            <span className="error-emoji" aria-hidden>
              🛠️
            </span>
          </h1>
          <h2 className="error-subtitle">Космическая турбулентность</h2>
          <p className="section-subtitle error-message">
            Что-то сломалось на сервере — сигнал потерян.
          </p>
          <p className="section-subtitle error-message">
            Мы уже чиним ретранслятор. Попробуйте обновить страницу позже.
          </p>
        </div>
      </main>

      <Footer />
    </div>
  )
}

export const initError500Page = () => Promise.resolve()
