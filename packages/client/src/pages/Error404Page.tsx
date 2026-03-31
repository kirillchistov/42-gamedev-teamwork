// Ошибка 404 - страница не найдена
import { Helmet } from 'react-helmet'
import clsx from 'clsx'
import { useNavigate } from 'react-router-dom'

import { Header } from '../components/Header'
import { Footer } from '../components/Footer'
import { Button } from '../shared/ui'
import { usePage } from '../hooks/usePage'

export const Error404Page = () => {
  usePage({ initPage: initError404Page })
  const navigate = useNavigate()

  const handleBackHome = () => navigate('/')

  return (
    <div className={clsx('landing', 'ErrorPage')}>
      <Helmet>
        <meta charSet="utf-8" />
        <title>Ошибка 404 — CosMatch</title>
        <meta name="description" content="Страница не найдена 404" />
      </Helmet>

      <Header />

      <main className="auth-main">
        <div className="auth-card auth-card--wide error-card">
          <h1 className="error-title error-title--404">
            404{' '}
            <span className="error-emoji" aria-hidden>
              🛰️
            </span>
          </h1>
          <h2 className="error-subtitle">Космическая пустота</h2>
          <p className="section-subtitle error-message">
            К сожалению, запрашиваемая страница потерялась где-то в туманности.
          </p>
          <Button type="button" variant="primary" onClick={handleBackHome}>
            Вернуться на главную
          </Button>
        </div>
      </main>

      <Footer />
    </div>
  )
}

export const initError404Page = () => Promise.resolve()
