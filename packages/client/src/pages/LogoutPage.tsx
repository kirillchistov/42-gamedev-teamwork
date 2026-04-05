/** Изменения и починка Sprint6 Chores
 * /logout: на серверне и клиенте, затем /login + «Вы вышли».
 * Аналогично LoginPage: logout перед signin.
 */

import React, {
  FormEvent,
  useEffect,
  useState,
} from 'react'
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
  logoutThunk,
  selectUserError,
  selectUserIsAuthChecked,
  selectUserIsLoading,
} from '../slices/userSlice'

// Разлогиниаем на серверне и клиенте, затем /login + «Вы вышли».
export const LogoutPage: React.FC = () => {
  usePage({ initPage: initLogoutPage })
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
  const [isLoggingOut, setIsLoggingOut] =
    useState(false)

  // После проверки сессии — принудительный logout
  useEffect(() => {
    if (!isAuthChecked) return
    let alive = true
    const reset = async () => {
      setIsLoggingOut(true)
      await dispatch(logoutThunk())
      if (alive) setIsLoggingOut(false)
    }
    void reset()
    return () => {
      alive = false
    }
  }, [dispatch, isAuthChecked])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    await dispatch(logoutThunk())
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
        <title>Выход — Cosmic Match</title>
        <meta
          name="description"
          content="Выход из аккаунта"
        />
      </Helmet>

      <Header />

      <main className="auth-main">
        {!isAuthChecked || isLoggingOut ? (
          <section className="auth-card auth-card--wide">
            <p>Выходим из текущей сессии...</p>
          </section>
        ) : (
          <section className="auth-card auth-card--wide">
            <h1>Вы вышли</h1>
            <p className="auth-note">
              Войти снова
            </p>
            <form
              className="auth-form auth-form--grid"
              id="logout-login-form"
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

export const initLogoutPage = ({
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
