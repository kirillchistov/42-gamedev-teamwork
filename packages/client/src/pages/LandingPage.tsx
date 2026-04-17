import { Helmet } from 'react-helmet'
import { usePage } from '../hooks/usePage'
import { PageInitArgs } from '../routes'
import { Header } from '../components/Header'
import { Hero } from '../components/Landing/Hero'
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
// import { About } from '../components/Landing/About'
// import { useSelector } from '../store';

export const LandingPage = () => {
  usePage({ initPage: initLandingPage })
  const { theme } = useLandingTheme()
  const user = useSelector(selectUser)
  const isAuthorized = Boolean(user)

  return (
    <div
      id="landing-root"
      className={`landing landing--${theme}`}>
      <Helmet>
        <title>Cosmic Match - главная</title>
        <meta
          name="description"
          content="Браузерная игра «3 в ряд» в космосе: Cosmic Match"
        />
      </Helmet>
      <Header />
      <main>
        <Hero />
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

export const initLandingPage = ({
  dispatch,
  state,
}: PageInitArgs) => {
  const queue: Array<Promise<unknown>> = []

  if (!selectUserIsAuthChecked(state)) {
    queue.push(
      dispatch(fetchUserThunk()).catch(
        () => undefined
      )
    )
  }

  return Promise.all(queue)
}
