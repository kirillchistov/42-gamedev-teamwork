import { Helmet } from 'react-helmet'
import { Link } from 'react-router-dom'

import { useDispatch, useSelector } from '../store'
import { Header } from '../components/Header'
import { Footer } from '../components/Footer'
import { Button } from '../shared/ui'
import {
  fetchFriendsThunk,
  removeFriendThunk,
  selectFriends,
  selectFriendsActionError,
  selectIsLoadingFriends,
  clearFriendsActionError,
} from '../slices/friendsSlice'
import {
  fetchUserThunk,
  selectUser,
  selectUserIsAuthChecked,
} from '../slices/userSlice'
import { PageInitArgs } from '../routes'
import { usePage } from '../hooks/usePage'
import { useLandingTheme } from '../contexts/LandingThemeContext'

export const FriendsPage = () => {
  const dispatch = useDispatch()
  const { theme } = useLandingTheme()
  const friends = useSelector(selectFriends)
  const isLoading = useSelector(selectIsLoadingFriends)
  const actionError = useSelector(selectFriendsActionError)
  const user = useSelector(selectUser)

  usePage({ initPage: initFriendsPage })

  return (
    <div className={`landing landing--${theme}`}>
      <Helmet>
        <meta charSet="utf-8" />
        <title>Друзья — Cosmic Match</title>
        <meta
          name="description"
          content="Список друзей для фильтра на лидерборде."
        />
      </Helmet>
      <Header />
      <main className="auth-main">
        <section className="auth-card auth-card--wide">
          <h1>Друзья</h1>
          <p className="auth-note">
            Добавляйте игроков на{' '}
            <Link to="/leaderboard" className="auth-link">
              лидерборде
            </Link>
            . Фильтр «Друзья» покажет только их результаты.
          </p>

          {user ? (
            <p>
              Вы вошли как {user.first_name} {user.second_name}
            </p>
          ) : (
            <p>Войдите, чтобы управлять списком друзей.</p>
          )}

          {actionError ? (
            <p className="auth-form__error">{actionError}</p>
          ) : null}

          {isLoading ? (
            <p>Загрузка списка…</p>
          ) : friends.length === 0 ? (
            <p>Список пуст. Откройте лидерборд и нажмите «В друзья».</p>
          ) : (
            <ul className="leaderboard-friends-list">
              {friends.map(friend => (
                <li key={friend.nickname}>
                  <span>{friend.displayName || friend.nickname}</span>
                  <Button
                    type="button"
                    variant="outline"
                    className="leaderboard-friend-btn"
                    onClick={() => {
                      dispatch(clearFriendsActionError())
                      void dispatch(removeFriendThunk(friend.nickname))
                    }}>
                    Убрать
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
      <Footer />
    </div>
  )
}

export const initFriendsPage = async ({
  dispatch,
  state,
  getState,
}: PageInitArgs) => {
  if (!selectUser(state) && !selectUserIsAuthChecked(state)) {
    await dispatch(fetchUserThunk()).catch(() => undefined)
  }

  if (selectUser(getState())) {
    await dispatch(fetchFriendsThunk()).catch(() => undefined)
  }
}
