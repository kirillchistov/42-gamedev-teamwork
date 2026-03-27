// Заглушка для cтраницы с логином
// Здесь будет валидация, подключение к API и обработка Already in system
import React from 'react'
import { Helmet } from 'react-helmet'

import { Header } from '../components/Header'
import { Footer } from '../components/Footer'
import { usePage } from '../hooks/usePage'
// import { PageInitArgs } from '../routes'
import { Link } from 'react-router-dom'
import { Button, FieldError, Input } from '../shared/ui'

export const LoginPage: React.FC = () => {
  usePage({ initPage: initLoginPage })

  return (
    <div className="landing landing--light-flat">
      <Helmet>
        <meta charSet="utf-8" />
        <title>Cosmic Match — Игра</title>
        <meta
          name="description"
          content="Игровое поле Cosmic Match: match‑3 в космосе."
        />
      </Helmet>

      <Header />

      <main className="auth-main">
        <section className="auth-card auth-card--wide">
          <h1>Вход</h1>
          <form
            className="auth-form auth-form--grid"
            id="login-form"
            noValidate>
            <label>
              Логин
              <Input
                type="text"
                name="login"
                placeholder="login"
                value="login"
              />
              <FieldError message="здесь будут ошибки" />
            </label>

            <label>
              Пароль
              <Input
                type="password"
                name="password"
                placeholder="Пароль"
                value="********"
              />
              <FieldError message="здесь будут ошибки" />
            </label>

            <div className="auth-form__actions">
              <Button type="submit" variant="primary">
                Войти
              </Button>
            </div>
          </form>

          <p className="auth-switch">
            Нет аккаунта?{' '}
            <Link to="/signup" className="auth-link">
              Зарегистрируйтесь
            </Link>
          </p>
        </section>
      </main>
      <Footer />
    </div>
  )
}

// export const initLoginPage = (_args: PageInitArgs) => {
//   // пока без запросов к бэкенду, просто резолвим промис для демонстрации
//   return Promise.resolve()
// }

export const initLoginPage = () => Promise.resolve()
