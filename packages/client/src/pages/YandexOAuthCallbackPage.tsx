import React, { useEffect, useState } from 'react'
import { Helmet } from 'react-helmet'
import {
  Link,
  useNavigate,
  useSearchParams,
} from 'react-router-dom'
import { Footer } from '../components/Footer'
import { Header } from '../components/Header'
import { useLandingTheme } from '../contexts/LandingThemeContext'
import { markGameLandingNeedsShow } from '../game/match3/gameLandingGate'
import {
  buildYandexRedirectUri,
  signInByYandexCode,
  YANDEX_OAUTH_STATE_KEY,
} from '../shared/api/oauthApi'
import { Button } from '../shared/ui'
import { fetchUserThunk } from '../slices/userSlice'
import { useDispatch } from '../store'

export const YandexOAuthCallbackPage: React.FC =
  () => {
    const { theme } = useLandingTheme()
    const [searchParams] = useSearchParams()
    const navigate = useNavigate()
    const dispatch = useDispatch()
    const [error, setError] = useState<
      string | null
    >(null)

    useEffect(() => {
      const code = searchParams.get('code')
      const oauthError = searchParams.get('error')
      const state = searchParams.get('state')
      const expectedState =
        window.sessionStorage.getItem(
          YANDEX_OAUTH_STATE_KEY
        )

      if (oauthError) {
        setError(
          `OAuth ошибка: ${oauthError}. Попробуйте снова.`
        )
        return
      }

      if (!code) {
        setError(
          'Код авторизации не получен. Проверьте redirect URI и повторите вход.'
        )
        return
      }

      if (expectedState !== state) {
        setError(
          'Состояние OAuth не совпало. Попробуйте войти еще раз.'
        )
        return
      }

      window.sessionStorage.removeItem(
        YANDEX_OAUTH_STATE_KEY
      )

      const redirectUri = buildYandexRedirectUri()

      void signInByYandexCode({
        code,
        redirect_uri: redirectUri,
      })
        .then(async () => {
          const result = await dispatch(
            fetchUserThunk()
          )
          if (
            !fetchUserThunk.fulfilled.match(
              result
            )
          ) {
            throw new Error(
              'Вход выполнен, но профиль не загрузился. Попробуйте обновить страницу.'
            )
          }
          markGameLandingNeedsShow()
          navigate('/game', { replace: true })
        })
        .catch((e: unknown) => {
          setError(
            e instanceof Error
              ? e.message
              : 'Не удалось завершить вход через Яндекс.'
          )
        })
    }, [dispatch, navigate, searchParams])

    return (
      <div
        className={`landing landing--${theme}`}>
        <Helmet>
          <meta charSet="utf-8" />
          <title>OAuth — Cosmic Match</title>
        </Helmet>
        <Header />
        <main className="auth-main">
          <section className="auth-card auth-card--wide">
            <h1>Вход через Яндекс</h1>
            {error ? (
              <>
                <p
                  role="alert"
                  style={{
                    color:
                      'var(--color-error, #e53935)',
                  }}>
                  {error}
                </p>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() =>
                    navigate('/login', {
                      replace: true,
                    })
                  }>
                  Повторить вход
                </Button>
              </>
            ) : (
              <p>Завершаем авторизацию...</p>
            )}
            <p className="auth-switch">
              <Link
                to="/login"
                className="auth-link">
                Вернуться к обычному входу
              </Link>
            </p>
          </section>
        </main>
        <Footer />
      </div>
    )
  }

export const initYandexOAuthCallbackPage = () =>
  Promise.resolve()
