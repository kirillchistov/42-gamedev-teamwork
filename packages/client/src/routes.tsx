import { AppDispatch, RootState } from './store'

import { initMainPage, MainPage } from './pages/Main'
import { initFriendsPage, FriendsPage } from './pages/FriendsPage'
import { initNotFoundPage, NotFoundPage } from './pages/NotFound'

// Новые страницы и их инициализации
import { LandingPage, initLandingPage } from './pages/LandingPage'
import { GamePage, initGamePage } from './pages/GamePage'
import { LoginPage, initLoginPage } from './pages/LoginPage'
import { SignupPage, initSignupPage } from './pages/SignupPage'
import { ProfilePage, initProfilePage } from './pages/ProfilePage'
import { ForumPage, initForumPage } from './pages/ForumPage'
import { ForumTopicPage, initForumTopicPage } from './pages/ForumTopicPage'
import { LeaderboardPage, initLeaderboardPage } from './pages/LeaderboardPage'
import { Error404Page, initError404Page } from './pages/Error404Page'
import { Error500Page, initError500Page } from './pages/Error500Page'

export type PageInitContext = {
  clientToken?: string
}

export type PageInitArgs = {
  dispatch: AppDispatch
  state: RootState
  ctx: PageInitContext
}

export const routes = [
  {
    path: '/',
    Component: LandingPage,
    fetchData: initLandingPage,
  },
  {
    path: '/game',
    Component: GamePage,
    fetchData: initGamePage,
  },
  {
    path: '/login',
    Component: LoginPage,
    fetchData: initLoginPage,
  },
  {
    path: '/signup',
    Component: SignupPage,
    fetchData: initSignupPage,
  },
  {
    path: '/profile',
    Component: ProfilePage,
    fetchData: initProfilePage,
  },
  {
    path: '/forum',
    Component: ForumPage,
    fetchData: initForumPage,
  },
  {
    path: '/forum-topic',
    Component: ForumTopicPage,
    fetchData: initForumTopicPage,
  },
  {
    path: '/forum/:topicId',
    Component: ForumTopicPage,
    fetchData: initForumTopicPage,
  },
  {
    path: '/leaderboard',
    Component: LeaderboardPage,
    fetchData: initLeaderboardPage,
  },
  {
    path: '*',
    Component: Error404Page,
    fetchData: initError404Page,
  },
  {
    path: '*',
    Component: Error500Page,
    fetchData: initError500Page,
  },

  // исходные шаблонные роуты
  {
    path: '/template',
    Component: MainPage,
    fetchData: initMainPage,
  },
  {
    path: '/friends',
    Component: FriendsPage,
    fetchData: initFriendsPage,
  },
  {
    path: '*',
    Component: NotFoundPage,
    fetchData: initNotFoundPage,
  },
]
