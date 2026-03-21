// Пока заглушка, потом будет страница регистрации
// packages/client/src/pages/SignupPage.tsx
import React from 'react'
import { Helmet } from 'react-helmet'
import { usePage } from '../hooks/usePage'
import { PageInitArgs } from '../routes'
import { useSelector } from '../store'
import { selectUser, fetchUserThunk } from '../slices/userSlice'

export const SignupPage: React.FC = () => {
  usePage({ initPage: initSignupPage })

  const user = useSelector(selectUser)

  return (
    <div className="AuthPage">
      <Helmet>
        <title>Регистрация — Cosmic Match</title>
      </Helmet>

      <main className="auth-main">
        <section className="auth-card auth-card--wide">
          <h1>Регистрация</h1>
          {user && (
            <p className="auth-note">
              Вы уже авторизованы
              {/* Вы уже авторизованы как <strong>{user.login}</strong> */}
            </p>
          )}

          <form className="auth-form auth-form--grid">
            <label>
              Имя
              <input type="text" placeholder="Имя" />
            </label>
            <label>
              Фамилия
              <input type="text" placeholder="Фамилия" />
            </label>
            <label>
              Почта
              <input type="email" placeholder="user@example.com" />
            </label>
            <label>
              Телефон
              <input type="tel" placeholder="+7..." />
            </label>
            <label>
              Логин
              <input type="text" placeholder="login" />
            </label>
            <label>
              Пароль
              <input type="password" placeholder="Пароль" />
            </label>

            <div className="auth-form__actions">
              <button type="submit" className="btn btn--primary">
                Зарегистрироваться
              </button>
            </div>
          </form>

          <p className="auth-switch">
            Уже есть аккаунт?{' '}
            <a href="/login" className="auth-link">
              Войти
            </a>
          </p>
        </section>
      </main>
    </div>
  )
}

export const initSignupPage = ({ dispatch, state }: PageInitArgs) => {
  const queue: Array<Promise<unknown>> = []
  if (!selectUser(state)) {
    queue.push(dispatch(fetchUserThunk()))
  }
  return Promise.all(queue)
}
