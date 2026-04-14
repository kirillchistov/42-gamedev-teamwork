/** Изменения и починка Sprint6 Chores:
 * Сбрасываем серверную сессию при заходе на /login и перед signin,
 * чтобы починить 400 «User already in system» (см. loginThunk).
 */
import React, { FormEvent, useState } from 'react'
import { Helmet } from 'react-helmet'
import {
  Link,
  useNavigate,
} from 'react-router-dom'
import { Header } from '../components/Header'
import { Footer } from '../components/Footer'
import { useLandingTheme } from '../contexts/LandingThemeContext'
import { usePage } from '../hooks/usePage'
import { PageInitArgs } from '../routes'
import { Button, Input } from '../shared/ui'
import {
  useDispatch,
  useSelector,
} from '../store'
import {
  fetchUserThunk,
  loginThunk,
  selectUserError,
  selectUserIsAuthChecked,
  selectUserIsLoading,
} from '../slices/userSlice'

export const LoginPage: React.FC = () => {
  usePage({ initPage: initLoginPage })
  const { theme } = useLandingTheme()

  const dispatch = useDispatch()
  const navigate = useNavigate()
  const isAuthChecked = useSelector(
    selectUserIsAuthChecked
  )
  const isLoading = useSelector(
    selectUserIsLoading
  )
  const error = useSelector(selectUserError)

  const [login, setLogin] = useState('')
  const [password, setPassword] = useState('')

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    const result = await dispatch(
      loginThunk({ login, password })
    )
    if (loginThunk.fulfilled.match(result)) {
      navigate('/game', { replace: true })
    }
  }

  return (
    <div className={`landing landing--${theme}`}>
      <Helmet>
        <meta charSet="utf-8" />
        <title>Вход — Cosmic Match</title>
        <meta
          name="description"
          content="Авторизация"
        />
      </Helmet>

      <Header />

      <main className="auth-main">
        {!isAuthChecked ? (
          <section className="auth-card auth-card--wide">
            <p>Проверяем текущую сессию...</p>
          </section>
        ) : (
          <section className="auth-card auth-card--wide">
            <h1>Вход</h1>
            <form
              className="auth-form auth-form--grid"
              id="login-form"
              onSubmit={handleSubmit}
              noValidate>
              <label>
                Логин
                <Input
                  type="text"
                  name="login"
                  placeholder="login"
                  value={login}
                  onChange={e =>
                    setLogin(e.target.value)
                  }
                  autoComplete="username"
                />
              </label>

              <label>
                Пароль
                <Input
                  type="password"
                  name="password"
                  placeholder="Пароль"
                  value={password}
                  onChange={e =>
                    setPassword(e.target.value)
                  }
                  autoComplete="current-password"
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
                    ? 'Входим...'
                    : 'Войти'}
                </Button>
              </div>
            </form>

            <p className="auth-switch">
              Нет аккаунта?{' '}
              <Link
                to="/signup"
                className="auth-link">
                Зарегистрируйтесь
              </Link>
            </p>
          </section>
        )}
      </main>
      <Footer />
    </div>
  )
}

export const initLoginPage = ({
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
