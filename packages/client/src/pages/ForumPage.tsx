// Пока заглушка, потом будет страница форума
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

export const ForumPage: React.FC = () => {
  const friends = useSelector(selectFriends)
  const isLoading = useSelector(selectIsLoadingFriends)
  const user = useSelector(selectUser)

  usePage({ initPage: initForumPage })

  return (
    <div className="landing landing--light-flat AuthPage">
      <Helmet>
        <meta charSet="utf-8" />
        <title>Форум Cosmic Match</title>
        <meta name="description" content="Демо‑страница форума Cosmic Match." />
      </Helmet>

      <Header />

      <main className="auth-main">
        <div className="auth-card auth-card--wide">
          <h1>Форум Cosmic Match</h1>
          <p className="auth-note">
            Темы и ответы пока статичны. Друзья и пользователь подгружаются так
            же, как на странице друзей.
          </p>

          <div className="extra-card" style={{ marginBottom: 16 }}>
            <h3>Темы</h3>
            <table>
              <thead>
                <tr>
                  <th>Тема</th>
                  <th>Автор</th>
                  <th>Ответов</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Баланс уровней match‑3</td>
                  <td>dev-1</td>
                  <td>3</td>
                </tr>
                <tr>
                  <td>Идеи новых бомб</td>
                  <td>dev-3</td>
                  <td>5</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="extra-card" style={{ marginBottom: 16 }}>
            <h3>Демо‑список друзей (как на FriendsPage)</h3>
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

          <div className="extra-card">
            <h3>Создать новую тему</h3>
            <form>
              <label>
                Заголовок темы
                <input type="text" placeholder="Идеи бонусных уровней" />
              </label>
              <label>
                Сообщение
                <textarea rows={4} placeholder="Опишите вашу идею или вопрос" />
              </label>
              <button type="button" className="btn btn--primary">
                Опубликовать
              </button>
            </form>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}

export const initForumPage = ({ dispatch, state }: PageInitArgs) => {
  const queue: Array<Promise<unknown>> = [dispatch(fetchFriendsThunk())]
  if (!selectUser(state)) {
    queue.push(dispatch(fetchUserThunk()))
  }
  return Promise.all(queue)
}
