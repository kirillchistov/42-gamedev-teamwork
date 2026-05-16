/** Изменения и починка Sprint6 Chores:
 * Сбрасываем серверную сессию при заходе на /login и перед signin,
 * чтобы починить 400 «User already in system» (см. loginThunk).
 * При уже залогиненном пользователе на /login и /signup — logout + повторная проверка /auth/user.
 */
import React, { FormEvent, useState } from 'react'
import { Helmet } from 'react-helmet'
import {
  Link,
  useLocation,
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
  selectUser,
  selectUserError,
  selectUserIsAuthChecked,
  selectUserIsLoading,
} from '../slices/userSlice'
import { markGameLandingNeedsShow } from '../game/match3/gameLandingGate'
import {
  buildYandexAuthorizeUrl,
  buildYandexRedirectUri,
  getYandexServiceId,
  YANDEX_OAUTH_STATE_KEY,
} from '../shared/api/oauthApi'
import { consumeForumAuthRedirect } from '../shared/forumAuthRedirect'

export const LoginPage: React.FC = () => {
  usePage({ initPage: initLoginPage })
  const { theme } = useLandingTheme()
  const location = useLocation()

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

  const handleYandexOAuth = async () => {
    setIsOAuthLoading(true)
    setOauthError(null)

    try {
      const redirectUri = buildYandexRedirectUri()
      const state =
        typeof crypto !== 'undefined' &&
        'randomUUID' in crypto
          ? crypto.randomUUID()
          : Math.random().toString(36).slice(2)

      window.sessionStorage.setItem(
        YANDEX_OAUTH_STATE_KEY,
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

  const fromForum = Boolean(
    (
      location.state as {
        fromForum?: boolean
      } | null
    )?.fromForum
  )

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
            {fromForum ? (
              <div className="auth-page__toast-wrap">
                <div className="auth-page__toast">
                  Сессия для доступа к форуму
                  недоступна. Войдите снова.
                </div>
              </div>
            ) : null}
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
                <p className="auth-form__error">
                  {error}
                </p>
              )}
              {oauthError && (
                <p className="auth-form__error">
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
  getState,
}: PageInitArgs) => {
  const skipLogoutForForum =
    consumeForumAuthRedirect()

  const ensureGuest = async () => {
    if (!selectUserIsAuthChecked(getState())) {
      await dispatch(fetchUserThunk())
        .unwrap()
        .catch(() => undefined)
    }
    if (
      selectUser(getState()) &&
      !skipLogoutForForum
    ) {
      await dispatch(logoutThunk())
        .unwrap()
        .catch(() => undefined)
      await dispatch(fetchUserThunk())
        .unwrap()
        .catch(() => undefined)
    }
  }

  return ensureGuest()
}
