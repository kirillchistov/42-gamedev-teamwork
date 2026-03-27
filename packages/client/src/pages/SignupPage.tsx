// Пока заглушка, потом будет страница регистрации
// packages/client/src/pages/SignupPage.tsx
import React from 'react'
import { Helmet } from 'react-helmet'
import { usePage } from '../hooks/usePage'
import { PageInitArgs } from '../routes'
import { selectUser, fetchUserThunk } from '../slices/userSlice'
import { Link } from 'react-router-dom'
import { Button, FieldError, Input } from '../shared/ui'
import Header from '../components/Header'

export const SignupPage: React.FC = () => {
  usePage({ initPage: initSignupPage })

  return (
    <div className="AuthPage">
      <Helmet>
        <title>Регистрация — Cosmic Match</title>
      </Helmet>
      <Header />

      <main className="auth-main">
        <section className="auth-card auth-card--wide">
          <h1>Регистрация</h1>

          <form className="auth-form auth-form--grid">
            <label>
              Имя
              <Input type="text" placeholder="Имя" />
              <FieldError message="здесь будут ошибки" />
            </label>
            <label>
              Фамилия
              <Input type="text" placeholder="Фамилия" />
              <FieldError message="здесь будут ошибки" />
            </label>
            <label>
              Почта
              <Input type="email" placeholder="user@example.com" />
            </label>
            <label>
              Телефон
              <Input type="tel" placeholder="+7..." />
              <FieldError message="здесь будут ошибки" />
            </label>
            <label>
              Логин
              <Input type="text" placeholder="login" />
              <FieldError message="здесь будут ошибки" />
            </label>
            <label>
              Пароль
              <input type="password" placeholder="********" />
              <FieldError message="здесь будут ошибки" />
            </label>

            <div className="auth-form__actions">
              <Button type="submit" className="btn btn--primary">
                Зарегистрироваться
              </Button>
            </div>
          </form>
          <p className="auth-switch">
            Есть аккаунт?{' '}
            <Link to="/login" className="auth-link">
              Войдите
            </Link>
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
