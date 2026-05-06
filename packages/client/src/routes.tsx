/** Изменения и починка Sprint6 Chores:
 * Добавил /logout
 */
import type { ComponentType } from 'react'
import { RouteObject } from 'react-router-dom'
import { AppDispatch, RootState } from './store'

import {
  initMainPage,
  MainPage,
} from './pages/Main'
import {
  initFriendsPage,
  FriendsPage,
} from './pages/FriendsPage'
import {
  initNotFoundPage,
  NotFoundPage,
} from './pages/NotFound'

// Новые страницы и их инициализации
import {
  LandingPage,
  initLandingPage,
} from './pages/LandingPage'
import {
  GamePage,
  initGamePage,
} from './pages/GamePage'
import {
  LoginPage,
  initLoginPage,
} from './pages/LoginPage'
import {
  YandexOAuthCallbackPage,
  initYandexOAuthCallbackPage,
} from './pages/YandexOAuthCallbackPage'
import {
  LogoutPage,
  initLogoutPage,
} from './pages/LogoutPage'
import {
  SignupPage,
  initSignupPage,
} from './pages/SignupPage'
import {
  ProfilePage,
  initProfilePage,
} from './pages/ProfilePage'
import {
  ForumPage,
  initForumPage,
} from './pages/ForumPage'
import {
  ForumTopicPage,
  initForumTopicPage,
} from './pages/ForumTopicPage'
import {
  LeaderboardPage,
  initLeaderboardPage,
} from './pages/LeaderboardPage'
import {
  Error404Page,
  initError404Page,
} from './pages/Error404Page'
import {
  Error500Page,
  initError500Page,
} from './pages/Error500Page'
import {
  PremiumPage,
  initPremiumPage,
} from './pages/Premium'

export type PageInitContext = {
  clientToken?: string
}

export type PageInitArgs = {
  dispatch: AppDispatch
  state: RootState
  ctx: PageInitContext
}

// Расширяем RouteObject из react-router-dom: path и Component обязательны, fetchData — серверная инициализация
export type AppRoute = RouteObject & {
  path: string
  Component: ComponentType
  fetchData: (
    args: PageInitArgs
  ) => Promise<unknown> | void
}

export const routes: AppRoute[] = [
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
    path: '/game/',
    Component: GamePage,
    fetchData: initGamePage,
  },
  {
    path: '/game/start',
    Component: GamePage,
    fetchData: initGamePage,
  },
  {
    path: '/game/settings',
    Component: GamePage,
    fetchData: initGamePage,
  },
  {
    path: '/game/play',
    Component: GamePage,
    fetchData: initGamePage,
  },
  {
    path: '/game/finish',
    Component: GamePage,
    fetchData: initGamePage,
  },
  {
    path: '/login',
    Component: LoginPage,
    fetchData: initLoginPage,
  },
  {
    path: '/sign-in',
    Component: LoginPage,
    fetchData: initLoginPage,
  },
  {
    path: '/signin',
    Component: LoginPage,
    fetchData: initLoginPage,
  },
  {
    path: '/logout',
    Component: LogoutPage,
    fetchData: initLogoutPage,
  },
  {
    path: '/oauth/yandex/callback',
    Component: YandexOAuthCallbackPage,
    fetchData: initYandexOAuthCallbackPage,
  },
  {
    path: '/signup',
    Component: SignupPage,
    fetchData: initSignupPage,
  },
  {
    path: '/register',
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
    path: '/premium',
    Component: PremiumPage,
    fetchData: initPremiumPage,
  },
  {
    path: '/error404',
    Component: Error404Page,
    fetchData: initError404Page,
  },
  {
    path: '/error/404',
    Component: Error404Page,
    fetchData: initError404Page,
  },
  {
    path: '/error400',
    Component: Error404Page,
    fetchData: initError404Page,
  },
  {
    path: '/error/400',
    Component: Error404Page,
    fetchData: initError404Page,
  },
  {
    path: '/error500',
    Component: Error500Page,
    fetchData: initError500Page,
  },
  {
    path: '/error/500',
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
