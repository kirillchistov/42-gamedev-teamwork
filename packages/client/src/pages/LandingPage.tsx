// 7.3 chores: лендинг — редирект OAuth с / только при совпадении state в session.

import { useEffect, useState } from 'react'
import { Helmet } from 'react-helmet'
import { useLocation, useNavigate } from 'react-router-dom'
import { usePage } from '../hooks/usePage'
import { PageInitArgs } from '../routes'
import { Header } from '../components/Header'
import { Hero } from '../components/Landing/Hero'
import { ProjectPresentationCarousel } from '../components/ProjectPresentation/ProjectPresentationCarousel'
import { HowToPlay } from '../components/Landing/HowToPlay'
import { Benefits } from '../components/Landing/Benefits'
import { Team } from '../components/Landing/Team'
import { Contact } from '../components/Landing/Contact'
import { LandingLeaders } from '../components/Landing/LandingLeaders'
import { Blog } from '../components/Landing/Blog'
import { Footer } from '../components/Footer'
import {
  selectUserIsAuthChecked,
  selectUser,
  // selectUser,
  fetchUserThunk,
} from '../slices/userSlice'
import { useLandingTheme } from '../contexts/LandingThemeContext'
import { useSelector } from '../store'
import { YANDEX_OAUTH_STATE_KEY } from '../shared/api/oauthApi'
// import { About } from '../components/Landing/About'
// import { useSelector } from '../store';

export const LandingPage = () => {
  usePage({ initPage: initLandingPage })
  const [presentationOpen, setPresentationOpen] = useState(false)
  const { theme } = useLandingTheme()
  const user = useSelector(selectUser)
  const isAuthorized = Boolean(user)
  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    if (location.pathname !== '/') return

    const params = new URLSearchParams(location.search)
    if (params.has('error')) {
      navigate(`/oauth/yandex/callback${location.search}`, { replace: true })
      return
    }

    if (params.has('code')) {
      const stored = window.sessionStorage.getItem(YANDEX_OAUTH_STATE_KEY)
      const state = params.get('state')
      if (state != null && state !== '' && state === stored) {
        navigate(`/oauth/yandex/callback${location.search}`, { replace: true })
      }
    }
  }, [location.pathname, location.search, navigate])

  return (
    <div id="landing-root" className={`landing landing--${theme}`}>
      <Helmet>
        <title>Cosmic Match - главная</title>
        <meta
          name="description"
          content="Браузерная игра «3 в ряд» в космосе: Cosmic Match"
        />
      </Helmet>
      <Header />
      <main>
        <Hero onOpenPresentation={() => setPresentationOpen(true)} />
        <ProjectPresentationCarousel
          open={presentationOpen}
          onOpenChange={setPresentationOpen}
        />
        <HowToPlay />
        <Benefits />
        {isAuthorized ? <LandingLeaders /> : null}
        <Blog />
        <Team />
        <Contact />
      </main>
      <Footer />
    </div>
  )
}

export const initLandingPage = ({ dispatch, state }: PageInitArgs) => {
  const queue: Array<Promise<unknown>> = []

  if (!selectUserIsAuthChecked(state)) {
    queue.push(dispatch(fetchUserThunk()).catch(() => undefined))
  }

  return Promise.all(queue)
}
