// Пока заглушка, потом будет страница "Результаты/Лидерборд"
import React from 'react'
import { Helmet } from 'react-helmet'

import { Header } from '../components/Header'
import { Footer } from '../components/Footer'
import { useSelector } from '../store'
import {
  fetchFriendsThunk,
  selectFriends,
  selectIsLoadingFriends,
} from '../slices/friendsSlice'
import { fetchUserThunk, selectUser } from '../slices/userSlice'
import { usePage } from '../hooks/usePage'
import { PageInitArgs } from '../routes'

export const LeaderboardPage: React.FC = () => {
  const friends = useSelector(selectFriends)
  const isLoading = useSelector(selectIsLoadingFriends)
  const user = useSelector(selectUser)

  usePage({ initPage: initLeaderboardPage })

  return (
    <div className="landing landing--light-flat AuthPage">
      <Helmet>
        <meta charSet="utf-8" />
        <title>Лидерборд Cosmic Match</title>
        <meta
          name="description"
          content="Демо‑таблица рекордов для Cosmic Match."
        />
      </Helmet>

      <Header />

      <main className="auth-main">
        <div className="auth-card auth-card--wide">
          <h1>Лидерборд</h1>
          <p className="auth-note">
            Сейчас таблица рекордов статична. Данные друзей подгружаются так же,
            как на FriendsPage.
          </p>

          <div className="extra-card" style={{ marginBottom: 16 }}>
            <h3>Таблица рекордов</h3>
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Никнейм</th>
                  <th>Очки</th>
                  <th>Дата</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>1</td>
                  <td>Player123</td>
                  <td>1200</td>
                  <td>18.03.2026</td>
                </tr>
                <tr>
                  <td>2</td>
                  <td>Match3Pro</td>
                  <td>950</td>
                  <td>17.03.2026</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="extra-card">
            <h3>Демо‑список друзей</h3>
            {user ? (
              <p>
                Вы вошли как {user.name} {user.secondName}
              </p>
            ) : (
              <p>Пользователь не найден</p>
            )}

            {isLoading ? (
              <p>Загрузка списка друзей…</p>
            ) : (
              <ul>
                {friends.map(friend => (
                  <li key={friend.name}>
                    {friend.name} {friend.secondName}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}

export const initLeaderboardPage = ({ dispatch, state }: PageInitArgs) => {
  const queue: Array<Promise<unknown>> = [dispatch(fetchFriendsThunk())]
  if (!selectUser(state)) {
    queue.push(dispatch(fetchUserThunk()))
  }
  return Promise.all(queue)
}
