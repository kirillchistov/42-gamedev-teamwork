import { Helmet } from 'react-helmet'
import { usePage } from '../hooks/usePage'
import { PageInitArgs } from '../routes'
import { Header } from '../components/Header'
import { Hero } from '../components/Landing/Hero'
import { HowToPlay } from '../components/Landing/HowToPlay'
import { Benefits } from '../components/Landing/Benefits'
import { Leaderboard } from '../components/Landing/Leaderboard'
import { Forum } from '../components/Landing/Forum'
import { Team } from '../components/Landing/Team'
import { Contact } from '../components/Landing/Contact'
import { Footer } from '../components/Footer'
import {
  fetchUserThunk,
  selectUserIsAuthChecked,
} from '../slices/userSlice'

export const LandingPage = () => {
  usePage({ initPage: initLandingPage })

  return (
    <div
      id="landing-root"
      className="landing landing--light-flat">
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
        <Leaderboard />
        <Forum />
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
