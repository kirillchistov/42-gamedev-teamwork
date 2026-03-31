import { Helmet } from 'react-helmet'

import { Header } from '../components/Header'
import { usePage } from '../hooks/usePage'

export const AboutPage = () => {
  usePage({ initPage: initAboutPage })

  return (
    <div className="App">
      <Helmet>
        <meta charSet="utf-8" />
        <title>О проекте</title>
        <meta name="description" content="О проекте" />
      </Helmet>
      <Header />
      Здесь будет информация о проекте!
    </div>
  )
}

export const initAboutPage = () => Promise.resolve()
