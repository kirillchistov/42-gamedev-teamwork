// Пока заглушка, потом будет страница профиля
import React, { FormEvent, useEffect, useState } from 'react'
import { Helmet } from 'react-helmet'

import { Header } from '../components/Header'
import { Footer } from '../components/Footer'
import { usePage } from '../hooks/usePage'
import { PageInitArgs } from '../routes'
import { Button, Input, FieldError } from '../shared/ui'
// import { DEFAULT_AVATAR_PATH } from '../constants'
// при необходимости позже можно подтянуть selectUser / fetchUserThunk
// import { type ProfileFormValues } from '../shared/validation/authValidation'

import { useValidate } from '../hooks/useValidate'
// import { setPageHasBeenInitializedOnServer } from '../slices/ssrSlice'

export const ProfilePage: React.FC = () => {
  usePage({ initPage: initProfilePage })

  const initialFields = {
    email: '',
    password: '',
    first_name: '',
    second_name: '',
    phone: '',
    login: '',
    nickname: '',
  }

  const { errors, doValidate, isValid } = useValidate(initialFields)
  const [values, setValues] = useState(initialFields)

  const handleChange: React.ChangeEventHandler<HTMLInputElement> = e => {
    const { name, value } = e.target
    setValues(prev => ({ ...prev, [name]: value }))
  }

  const handleBlur = (e: FormEvent<HTMLElement>) => {
    e.preventDefault()
    doValidate(values, submitForm)
  }

  const submitForm = () => {
    console.log('ошибка или сабмит?', errors)
  }

  useEffect(() => {
    doValidate(values, submitForm)
  }, [])

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
        <section className="auth-card auth-card--wide">
          <h1>Профиль игрока</h1>

          {/* Аватар */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 16,
              margin: '12px 0 24px',
              flexWrap: 'wrap',
            }}>
            <div
              style={{
                width: 96,
                height: 96,
                borderRadius: '999px',
                overflow: 'hidden',
                background:
                  'radial-gradient(circle at 30% 30%, #6366f1, #0f172a)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow:
                  '0 10px 25px rgba(15,23,42,0.9), 0 0 0 2px rgba(148,163,184,0.7)',
              }}>
              <div
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: '999px',
                  background:
                    'radial-gradient(circle at 30% 30%, #38bdf8, #4c1d95)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontSize: 32,
                }}>
                👤
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <Button type="button" variant="flat">
                Удалить аватар
              </Button>
              <Button type="button" variant="outline">
                Сменить аватар
              </Button>
              <FieldError message="" />
            </div>
          </div>

          {/* Форма профиля */}
          <form
            className="auth-form auth-form--grid"
            id="profile-form"
            noValidate>
            <label>
              Имя
              <Input
                type="text"
                name="first_name"
                placeholder="Имя"
                value={values.first_name}
                onChange={handleChange}
                onBlur={e => handleBlur(e)}
              />
              <FieldError message={errors.first_name} />
            </label>

            <label>
              Фамилия
              <Input
                type="text"
                name="second_name"
                placeholder="Фамилия"
                value={values.second_name}
                onChange={handleChange}
                onBlur={e => handleBlur(e)}
              />
              <FieldError message={errors.second_name} />
            </label>

            <label>
              Почта
              <Input
                type="email"
                name="email"
                placeholder="user@example.com"
                value={values.email}
                onChange={handleChange}
                onBlur={e => handleBlur(e)}
              />
              <FieldError message={errors.email} />
            </label>

            <label>
              Телефон
              <Input
                type="tel"
                name="phone"
                placeholder="+7..."
                value={values.phone}
                onChange={handleChange}
                onBlur={e => handleBlur(e)}
              />
              <FieldError message={errors.phone} />
            </label>

            <label>
              Логин
              <Input
                type="text"
                name="login"
                placeholder="login"
                value={values.login}
                onChange={handleChange}
                onBlur={e => handleBlur(e)}
              />
              <FieldError message={errors.login} />
            </label>

            <label>
              Никнейм
              <Input
                type="text"
                name="nickname"
                placeholder="Никнейм"
                value={values.nickname}
                onChange={handleChange}
                onBlur={e => handleBlur(e)}
              />
              <FieldError message={errors.nickname} />
            </label>

            <label>
              Новый пароль
              <input
                type="password"
                name="password"
                placeholder="Новый пароль"
                value={values.password}
                onChange={handleChange}
                onBlur={e => handleBlur(e)}
              />
              <FieldError message={errors.password} />
            </label>

            <div className="auth-form__actions">
              <Button
                type="button"
                className={
                  (isValid ? 'btn--disabled' : '') + ' btn btn--primary'
                }
                disabled={isValid}>
                Сохранить изменения
              </Button>
            </div>
          </form>
        </section>
      </main>

      {/* Модальное окно смены аватара будет здесь */}
      <Footer />
    </div>
  )
}

export const initProfilePage = (_args: PageInitArgs) => {
  console.log(_args)
  // позже здесь будет загрузку данных профиля из API
  return Promise.resolve()
}
