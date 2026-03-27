import { Helmet } from 'react-helmet'

import { Header } from '../components/Header'
import { usePage } from '../hooks/usePage'

export const Error404Page = () => {
  usePage({ initPage: initError404Page })

  return (
    <div className="App">
      <Helmet>
        <meta charSet="utf-8" />
        <title>404</title>
        <meta name="description" content="Страница не найдена" />
      </Helmet>
      <Header />
      <h2 className="error-subtitle">Космическая пустота</h2>
      <p className="section-subtitle error-message">
        К сожалению, запрашиваемая страница потерялась где-то в туманности.
      </p>
    </div>
  )
}

export const initError404Page = () => Promise.resolve()
