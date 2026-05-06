/** Изменения и починка Sprint6 Chores:
 * Сбрасываем серверную сессию при заходе на /login и перед signin,
 * чтобы починить 400 «User already in system» (см. loginThunk).
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
import {
  Button,
  FieldError,
  Input,
} from '../shared/ui'
import { useValidate } from '../hooks/useValidate'
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
import { markGameLandingNeedsShow } from '../game/match3/gameLandingGate'
import {
  buildYandexAuthorizeUrl,
  buildYandexRedirectUri,
  getYandexServiceId,
} from '../shared/api/oauthApi'

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
  const loginValidate = useValidate()

  const [login, setLogin] = useState('')
  const [password, setPassword] = useState('')
  const [isOAuthLoading, setIsOAuthLoading] =
    useState(false)
  const [oauthError, setOauthError] = useState<
    string | null
  >(null)
  const [isPreLogoutDone, setIsPreLogoutDone] =
    useState(false)

  useEffect(() => {
    if (!isAuthChecked || isPreLogoutDone) return
    setIsPreLogoutDone(true)
    void dispatch(logoutThunk())
  }, [dispatch, isAuthChecked, isPreLogoutDone])

  const handleYandexOAuth = async () => {
    setIsOAuthLoading(true)
    setOauthError(null)
    try {
      const redirectUri = buildYandexRedirectUri()
      const state = Math.random()
        .toString(36)
        .slice(2)
      window.sessionStorage.setItem(
        'oauth:yandex:state',
        state
      )
      const serviceId = await getYandexServiceId(
        redirectUri
      )
      const url = buildYandexAuthorizeUrl(
        serviceId,
        redirectUri,
        state
      )
      window.location.assign(url)
    } catch (e) {
      setOauthError(
        e instanceof Error
          ? e.message
          : 'Не удалось запустить OAuth вход'
      )
      setIsOAuthLoading(false)
    }
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    loginValidate.doValidate(
      { login, password },
      async () => {
        const result = await dispatch(
          loginThunk({ login, password })
        )
        if (loginThunk.fulfilled.match(result)) {
          markGameLandingNeedsShow()
          navigate('/game', { replace: true })
        }
      }
    )
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
                  onFocus={() =>
                    loginValidate.handleFieldFocus(
                      'login'
                    )
                  }
                  onBlur={e =>
                    loginValidate.handleFieldBlur(
                      'login',
                      e.target.value
                    )
                  }
                  autoComplete="username"
                />
                <FieldError
                  message={loginValidate.getFieldError(
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
                  value={password}
                  onChange={e =>
                    setPassword(e.target.value)
                  }
                  onFocus={() =>
                    loginValidate.handleFieldFocus(
                      'password'
                    )
                  }
                  onBlur={e =>
                    loginValidate.handleFieldBlur(
                      'password',
                      e.target.value
                    )
                  }
                  autoComplete="current-password"
                />
                <FieldError
                  message={loginValidate.getFieldError(
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
              {oauthError && (
                <p
                  style={{
                    color:
                      'var(--color-error, #e53935)',
                    margin: 0,
                    gridColumn: '1 / -1',
                  }}>
                  {oauthError}
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
                <Button
                  type="button"
                  variant="outline"
                  className="auth-oauth-btn"
                  disabled={
                    isOAuthLoading || isLoading
                  }
                  onClick={handleYandexOAuth}>
                  {isOAuthLoading ? (
                    'Переход к OAuth...'
                  ) : (
                    <>
                      <span>Войти через</span>
                      <span
                        className="auth-oauth-btn__logo"
                        aria-hidden="true">
                        Я
                      </span>
                    </>
                  )}
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
