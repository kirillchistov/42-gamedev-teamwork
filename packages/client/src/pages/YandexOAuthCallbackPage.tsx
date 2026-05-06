import React, { useEffect, useState } from 'react'
import { Helmet } from 'react-helmet'
import {
  useNavigate,
  useSearchParams,
} from 'react-router-dom'
import { Header } from '../components/Header'
import { Footer } from '../components/Footer'
import { useLandingTheme } from '../contexts/LandingThemeContext'
import {
  buildYandexRedirectUri,
  signInByYandexCode,
} from '../shared/api/oauthApi'
import { useDispatch } from '../store'
import { fetchUserThunk } from '../slices/userSlice'
import { markGameLandingNeedsShow } from '../game/match3/gameLandingGate'
import { PageInitArgs } from '../routes'

const OAUTH_STATE_KEY = 'oauth:yandex:state'

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
          OAUTH_STATE_KEY
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

      if (
        expectedState &&
        state &&
        expectedState !== state
      ) {
        setError(
          'Состояние OAuth не совпало. Попробуйте войти ещё раз.'
        )
        return
      }

      window.sessionStorage.removeItem(
        OAUTH_STATE_KEY
      )

      const redirectUri = buildYandexRedirectUri()
      void signInByYandexCode({
        code,
        redirect_uri: redirectUri,
      })
        .then(async () => {
          await dispatch(fetchUserThunk())
          markGameLandingNeedsShow()
          navigate('/game', { replace: true })
        })
        .catch((e: unknown) => {
          const message =
            e instanceof Error
              ? e.message
              : 'Не удалось завершить вход через Яндекс.'
          setError(message)
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
              <p
                role="alert"
                style={{
                  color:
                    'var(--color-error, #e53935)',
                }}>
                {error}
              </p>
            ) : (
              <p>Завершаем авторизацию…</p>
            )}
          </section>
        </main>
        <Footer />
      </div>
    )
  }

export const initYandexOAuthCallbackPage = (
  _args: PageInitArgs
) => Promise.resolve()
