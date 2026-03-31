import React, { FormEvent, useState } from 'react'
import { Helmet } from 'react-helmet'
import {
  Link,
  Navigate,
  useNavigate,
} from 'react-router-dom'
import { Header } from '../components/Header'
import { Footer } from '../components/Footer'
import { usePage } from '../hooks/usePage'
import { Button, Input } from '../shared/ui'
import {
  useDispatch,
  useSelector,
} from '../store'
import {
  loginThunk,
  selectUser,
  selectUserError,
  selectUserIsLoading,
} from '../slices/userSlice'

export const LoginPage: React.FC = () => {
  usePage({ initPage: initLoginPage })

  const dispatch = useDispatch()
  const navigate = useNavigate()
  const user = useSelector(selectUser)
  const isLoading = useSelector(
    selectUserIsLoading
  )
  const error = useSelector(selectUserError)

  const [login, setLogin] = useState('')
  const [password, setPassword] = useState('')

  if (user) {
    return <Navigate to="/" replace />
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    const result = await dispatch(
      loginThunk({ login, password })
    )
    if (loginThunk.fulfilled.match(result)) {
      navigate('/', { replace: true })
    }
  }

  return (
    <div className="landing landing--light-flat">
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
      </main>
      <Footer />
    </div>
  )
}

export const initLoginPage = () =>
  Promise.resolve()
