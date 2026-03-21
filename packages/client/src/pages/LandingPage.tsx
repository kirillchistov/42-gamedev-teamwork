import { Helmet } from 'react-helmet'

import { Header } from '../components/Header'
import { usePage } from '../hooks/usePage'

export const LandingPage = () => {
  usePage({ initPage: initLandingPage })

  return (
    <div className="App">
      <Helmet>
        <meta charSet="utf-8" />
        <title>Главная</title>
        <meta name="description" content="Главная страница" />
      </Helmet>
      <Header />
      Это самая главная страница!
    </div>
  )
}

export const initLandingPage = () => Promise.resolve()
