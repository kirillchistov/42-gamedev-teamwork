import { Helmet } from 'react-helmet'

import { Header } from '../components/Header'
import { usePage } from '../hooks/usePage'

export const LoginPage = () => {
  usePage({ initPage: initLoginPage })

  return (
    <div className="App">
      <Helmet>
        <meta charSet="utf-8" />
        <title>О проекте</title>
        <meta name="description" content="Авторизация" />
      </Helmet>
      <Header />
      Здесь будет авторизация пользователя!
    </div>
  )
}

export const initLoginPage = () => Promise.resolve()
