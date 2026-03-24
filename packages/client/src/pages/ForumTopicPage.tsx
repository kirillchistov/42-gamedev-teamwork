import { Helmet } from 'react-helmet'

import { Header } from '../components/Header'
import { usePage } from '../hooks/usePage'

export const ForumTopicPage = () => {
  usePage({ initPage: initForumTopicPage })

  return (
    <div className="App">
      <Helmet>
        <meta charSet="utf-8" />
        <title>Топик форума — Cosmic Match</title>
        <meta name="description" content="Топик форума — Cosmic Match" />
      </Helmet>
      <Header />
      {/* Здесь будет топик форума */}
    </div>
  )
}

export const initForumTopicPage = () => Promise.resolve()
