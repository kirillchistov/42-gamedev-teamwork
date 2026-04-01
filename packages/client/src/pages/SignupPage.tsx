import React, { FormEvent, useState } from 'react'
import { Helmet } from 'react-helmet'
import {
  Link,
  Navigate,
  useNavigate,
} from 'react-router-dom'
import { usePage } from '../hooks/usePage'
import { Button, Input } from '../shared/ui'
import { useLandingTheme } from '../contexts/LandingThemeContext'
import {
  useDispatch,
  useSelector,
} from '../store'
import {
  signupThunk,
  selectUser,
  selectUserError,
  selectUserIsLoading,
} from '../slices/userSlice'
import { Header } from '../components/Header'
import { Footer } from '../components/Footer'

export const initSignupPage = () =>
  Promise.resolve()

export const SignupPage: React.FC = () => {
  usePage({ initPage: initSignupPage })
  const { theme } = useLandingTheme()

  const dispatch = useDispatch()
  const navigate = useNavigate()
  const user = useSelector(selectUser)
  const isLoading = useSelector(
    selectUserIsLoading
  )
  const error = useSelector(selectUserError)

  const [firstName, setFirstName] = useState('')
  const [secondName, setSecondName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [login, setLogin] = useState('')
  const [password, setPassword] = useState('')

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

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    const result = await dispatch(
      signupThunk({
        first_name: firstName,
        second_name: secondName,
        email,
        phone,
        login,
        password,
      })
    )
    if (signupThunk.fulfilled.match(result)) {
      navigate('/game', { replace: true })
    }
  }

  return (
    <div className={`landing landing--${theme}`}>
      <Helmet>
        <title>Регистрация — Cosmic Match</title>
      </Helmet>
      <Header />

      <main className="auth-main">
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
                placeholder="Имя"
                value={firstName}
                onChange={e =>
                  setFirstName(e.target.value)
                }
                required
              />
            </label>
            <label>
              Фамилия
              <Input
                type="text"
                placeholder="Фамилия"
                value={secondName}
                onChange={e =>
                  setSecondName(e.target.value)
                }
                required
              />
            </label>
            <label>
              Почта
              <Input
                type="email"
                placeholder="user@example.com"
                value={email}
                onChange={e =>
                  setEmail(e.target.value)
                }
                required
              />
            </label>
            <label>
              Телефон
              <Input
                type="tel"
                placeholder="+7..."
                value={phone}
                onChange={e =>
                  setPhone(e.target.value)
                }
                required
              />
            </label>
            <label>
              Логин
              <Input
                type="text"
                placeholder="login"
                value={login}
                onChange={e =>
                  setLogin(e.target.value)
                }
                required
                autoComplete="username"
              />
            </label>
            <label>
              Пароль
              <Input
                type="password"
                placeholder="Пароль"
                value={password}
                onChange={e =>
                  setPassword(e.target.value)
                }
                required
                autoComplete="new-password"
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
      </main>
      <Footer />
    </div>
  )
}
