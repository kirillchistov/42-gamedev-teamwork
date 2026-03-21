// Пока заглушка, потом будет страница профиля
import React from 'react'
import { Helmet } from 'react-helmet'

import { Header } from '../components/Header'
import { Footer } from '../components/Footer'
import { usePage } from '../hooks/usePage'
import { PageInitArgs } from '../routes'
// при необходимости позже можно подтянуть selectUser / fetchUserThunk

export const ProfilePage: React.FC = () => {
  usePage({ initPage: initProfilePage })

  return (
    <div className="landing landing--light-flat AuthPage">
      <Helmet>
        <meta charSet="utf-8" />
        <title>Профиль игрока</title>
        <meta
          name="description"
          content="Демо‑страница профиля игрока Cosmic Match."
        />
      </Helmet>

      <Header />

      <main className="auth-main">
        <div className="auth-card auth-card--wide">
          <h1>Профиль игрока</h1>
          <p className="auth-note">
            Демо‑профиль без реальной авторизации. Данные пока не сохраняются.
          </p>

          <form className="auth-form auth-form--grid">
            <label>
              Имя
              <input type="text" placeholder="Иван" />
            </label>
            <label>
              Фамилия
              <input type="text" placeholder="Петров" />
            </label>
            <label>
              Никнейм
              <input type="text" placeholder="SpaceHunter" />
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
              Новый пароль
              <input type="password" placeholder="Новый пароль" />
            </label>

            <div className="auth-form__actions">
              <button type="button" className="btn btn--primary">
                Сохранить изменения
              </button>
            </div>
          </form>
        </div>
      </main>

      <Footer />
    </div>
  )
}

export const initProfilePage = (_args: PageInitArgs) => {
  // позже здесь будет загрузку данных профиля из API
  return Promise.resolve()
}
