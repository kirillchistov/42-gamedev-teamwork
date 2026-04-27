/** Изменения и починка Sprint6 Chores
 * Состояние формы — один объект SignupFormValues со всеми полями, как в профиле
 * Выравнил под validationRules.
 * Подключил useValidate(): те же правила и тексты, что в authValidation.ts.
 * onBlur → doValidate(form) — показ ошибок по полям, как в профиле.
 * handleSubmit — запрос уходит только если валидация прошла.
 * Под каждым полем FieldError с signupValidate.errors.*.
 * У инпутов name совпадает с ключами формы; проверка через noValidate и общие правила.
 * Кнопка «Зарегистрироваться» блокируется только isLoading.
 **/
import React, { FormEvent, useState } from 'react'
import { Helmet } from 'react-helmet'
import {
  Link,
  useNavigate,
  Navigate,
} from 'react-router-dom'
import { usePage } from '../hooks/usePage'
import { PageInitArgs } from '../routes'
import {
  Button,
  Input,
  FieldError,
} from '../shared/ui'
import { useValidate } from '../hooks/useValidate'
import type { SignupFormValues } from '../shared/validation/authValidation'
import { useLandingTheme } from '../contexts/LandingThemeContext'
import {
  useDispatch,
  useSelector,
} from '../store'
import {
  fetchUserThunk,
  selectUser,
  selectUserError,
  selectUserIsAuthChecked,
  selectUserIsLoading,
  signupThunk,
} from '../slices/userSlice'
import { markGameLandingNeedsShow } from '../game/match3/gameLandingGate'
import { Header } from '../components/Header'
import { Footer } from '../components/Footer'
import { AuthSessionNotice } from '../components/AuthSessionNotice'

export const initSignupPage = ({
  dispatch,
  state,
}: PageInitArgs) => {
  if (selectUserIsAuthChecked(state)) {
    return Promise.resolve()
  }

  return dispatch(fetchUserThunk()).catch(
    () => undefined
  )
}

export const SignupPage: React.FC = () => {
  usePage({ initPage: initSignupPage })
  const { theme } = useLandingTheme()

  const dispatch = useDispatch()
  const navigate = useNavigate()
  const user = useSelector(selectUser)
  const isAuthChecked = useSelector(
    selectUserIsAuthChecked
  )
  const isLoading = useSelector(
    selectUserIsLoading
  )
  const error = useSelector(selectUserError)

  const signupValidate = useValidate()
  const [form, setForm] =
    useState<SignupFormValues>({
      first_name: '',
      second_name: '',
      display_name: '',
      email: '',
      phone: '',
      login: '',
      password: '',
    })

  const handleChange: React.ChangeEventHandler<
    HTMLInputElement
  > = e => {
    const { name, value } = e.target
    setForm(prev => ({
      ...prev,
      [name]: value,
    }))
  }

  if (user) {
    return (
      <Navigate
        to="/game"
        replace
        state={{
          notice: 'Вы уже вошли в систему',
        }}
      />
    )
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    signupValidate.doValidate(form, async () => {
      const result = await dispatch(
        signupThunk({
          first_name: form.first_name ?? '',
          second_name: form.second_name ?? '',
          display_name:
            form.display_name ??
            `${form.first_name} ${form.second_name}`,
          email: form.email ?? '',
          phone: form.phone ?? '',
          login: form.login ?? '',
          password: form.password ?? '',
        })
      )
      if (signupThunk.fulfilled.match(result)) {
        markGameLandingNeedsShow()
        navigate('/game', { replace: true })
      }
    })
  }

  return (
    <div className={`landing landing--${theme}`}>
      <Helmet>
        <title>Регистрация — Cosmic Match</title>
      </Helmet>
      <Header />

      <main className="auth-main">
        {!isAuthChecked ? (
          <section className="auth-card auth-card--wide">
            <p>Проверяем текущую сессию...</p>
          </section>
        ) : user ? (
          <AuthSessionNotice actionLabel="Выйти и зарегистрировать другой аккаунт" />
        ) : (
          <section className="auth-card auth-card--wide">
            <h1>Регистрация</h1>

            <form
              className="auth-form auth-form--grid"
              onSubmit={handleSubmit}
              noValidate>
              <label>
                Имя
                <Input
                  type="text"
                  name="first_name"
                  placeholder="Имя"
                  value={form.first_name ?? ''}
                  onChange={handleChange}
                  onFocus={() =>
                    signupValidate.handleFieldFocus(
                      'first_name'
                    )
                  }
                  onBlur={e =>
                    signupValidate.handleFieldBlur(
                      'first_name',
                      e.target.value
                    )
                  }
                />
                <FieldError
                  message={signupValidate.getFieldError(
                    'first_name'
                  )}
                />
              </label>
              <label>
                Фамилия
                <Input
                  type="text"
                  name="second_name"
                  placeholder="Фамилия"
                  value={form.second_name ?? ''}
                  onChange={handleChange}
                  onFocus={() =>
                    signupValidate.handleFieldFocus(
                      'second_name'
                    )
                  }
                  onBlur={e =>
                    signupValidate.handleFieldBlur(
                      'second_name',
                      e.target.value
                    )
                  }
                />
                <FieldError
                  message={signupValidate.getFieldError(
                    'second_name'
                  )}
                />
              </label>
              <label>
                Никнейм
                <Input
                  type="text"
                  name="display_name"
                  placeholder="Никнейм"
                  value={form.display_name ?? ''}
                  onChange={handleChange}
                  onFocus={() =>
                    signupValidate.handleFieldFocus(
                      'display_name'
                    )
                  }
                  onBlur={e =>
                    signupValidate.handleFieldBlur(
                      'display_name',
                      e.target.value
                    )
                  }
                />
                <FieldError
                  message={signupValidate.getFieldError(
                    'display_name'
                  )}
                />
              </label>
              <label>
                Почта
                <Input
                  type="email"
                  name="email"
                  placeholder="user@example.com"
                  value={form.email ?? ''}
                  onChange={handleChange}
                  onFocus={() =>
                    signupValidate.handleFieldFocus(
                      'email'
                    )
                  }
                  onBlur={e =>
                    signupValidate.handleFieldBlur(
                      'email',
                      e.target.value
                    )
                  }
                />
                <FieldError
                  message={signupValidate.getFieldError(
                    'email'
                  )}
                />
              </label>
              <label>
                Телефон
                <Input
                  type="tel"
                  name="phone"
                  placeholder="+7..."
                  value={form.phone ?? ''}
                  onChange={handleChange}
                  onFocus={() =>
                    signupValidate.handleFieldFocus(
                      'phone'
                    )
                  }
                  onBlur={e =>
                    signupValidate.handleFieldBlur(
                      'phone',
                      e.target.value
                    )
                  }
                />
                <FieldError
                  message={signupValidate.getFieldError(
                    'phone'
                  )}
                />
              </label>
              <label>
                Логин
                <Input
                  type="text"
                  name="login"
                  placeholder="login"
                  value={form.login ?? ''}
                  onChange={handleChange}
                  onFocus={() =>
                    signupValidate.handleFieldFocus(
                      'login'
                    )
                  }
                  onBlur={e =>
                    signupValidate.handleFieldBlur(
                      'login',
                      e.target.value
                    )
                  }
                  autoComplete="username"
                />
                <FieldError
                  message={signupValidate.getFieldError(
                    'login'
                  )}
                />
              </label>
              <label>
                Пароль
                <Input
                  type="password"
                  name="password"
                  placeholder="Пароль"
                  value={form.password ?? ''}
                  onChange={handleChange}
                  onFocus={() =>
                    signupValidate.handleFieldFocus(
                      'password'
                    )
                  }
                  onBlur={e =>
                    signupValidate.handleFieldBlur(
                      'password',
                      e.target.value
                    )
                  }
                  autoComplete="new-password"
                />
                <FieldError
                  message={signupValidate.getFieldError(
                    'password'
                  )}
                />
              </label>

              {error && (
                <p
                  style={{
                    color:
                      'var(--color-error, #e53935)',
                    margin: 0,
                    gridColumn: '1 / -1',
                  }}>
                  {error}
                </p>
              )}

              <div className="auth-form__actions">
                <Button
                  type="submit"
                  variant="primary"
                  disabled={isLoading}>
                  {isLoading
                    ? 'Регистрируем...'
                    : 'Зарегистрироваться'}
                </Button>
              </div>
            </form>

            <p className="auth-switch">
              Есть аккаунт?{' '}
              <Link
                to="/login"
                className="auth-link">
                Войдите
              </Link>
            </p>
          </section>
        )}
      </main>
      <Footer />
    </div>
  )
}
