// Пока заглушка, потом будет лендинг
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
  selectUser,
  fetchUserThunk,
} from '../slices/userSlice'
import { useLandingTheme } from '../contexts/LandingThemeContext'
// import { About } from '../components/Landing/About'
// import { useSelector } from '../store';

export const LandingPage = () => {
  usePage({ initPage: initLandingPage })
  const { theme } = useLandingTheme()

  //   const user = useSelector(selectUser);

  return (
    <div
      id="landing-root"
      className={`landing landing--${theme}`}>
      <Helmet>
        <title>Cosmic Match — главная</title>
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
  // если пользователя нет в сторе — подтянем его, чтобы шапка сразу отобразила статус
  if (!selectUser(state)) {
    queue.push(dispatch(fetchUserThunk()))
  }
  return Promise.all(queue)
}
