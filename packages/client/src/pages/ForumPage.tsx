import React, { useEffect, useState } from 'react'
import { Helmet } from 'react-helmet'
import {
  Link,
  useNavigate,
} from 'react-router-dom'
import clsx from 'clsx'

import { Header } from '../components/Header'
import { Footer } from '../components/Footer'
import {
  useSelector,
  useDispatch,
} from '../store'
import { usePage } from '../hooks/usePage'
import { PageInitArgs } from '../routes'
import {
  Button,
  Input,
  TextArea,
} from '../shared/ui'
import {
  fetchTopicsThunk,
  createTopicThunk,
  selectTopics,
  selectIsLoadingForum,
  selectForumShouldRedirectToLogin,
  clearForumAuthRedirect,
} from '../slices/forumSlice'
import type { ForumRejectPayload } from '../slices/forumSlice'
import { markForumAuthRedirect } from '../shared/forumAuthRedirect'
import {
  fetchUserThunk,
  selectUser,
  selectUserIsAuthChecked,
} from '../slices/userSlice'
import { useLandingTheme } from '../contexts/LandingThemeContext'
import { IS_STATIC_GH_PAGES_DEPLOY } from '../constants'
import { StaticHostingForumNotice } from '../components/StaticHostingNotice'
import { isStaticGhPagesDeploy } from '../shared/staticDeploy'
import {
  validateForumContent,
  validateForumTitle,
} from '../shared/security/plainTextContent'
import { ForumPlainText } from '../components/forum/ForumPlainText'

export const ForumPage: React.FC = () => {
  const { theme } = useLandingTheme()
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const topics = useSelector(selectTopics)
  const isLoading = useSelector(
    selectIsLoadingForum
  )
  const shouldRedirectToLogin = useSelector(
    selectForumShouldRedirectToLogin
  )

  const [showCreateForm, setShowCreateForm] =
    useState(false)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [actionError, setActionError] = useState<
    string | null
  >(null)

  useEffect(() => {
    if (IS_STATIC_GH_PAGES_DEPLOY) {
      return
    }
    if (!shouldRedirectToLogin) {
      return
    }
    markForumAuthRedirect()
    dispatch(clearForumAuthRedirect())
    navigate('/login', {
      replace: true,
      state: { fromForum: true },
    })
  }, [shouldRedirectToLogin, dispatch, navigate])

  usePage({ initPage: initForumPage })

  const handleCreateTopic = async () => {
    setActionError(null)
    const titleCheck = validateForumTitle(title)
    if (!titleCheck.ok) {
      setActionError(titleCheck.reason)
      return
    }
    const contentCheck =
      validateForumContent(content)
    if (!contentCheck.ok) {
      setActionError(contentCheck.reason)
      return
    }
    try {
      await dispatch(
        createTopicThunk({
          title: titleCheck.value,
          content: contentCheck.value,
        })
      ).unwrap()
      setTitle('')
      setContent('')
      setShowCreateForm(false)
    } catch (e) {
      const p = e as ForumRejectPayload
      if (p?.status !== 403) {
        setActionError(
          p?.message || 'Не удалось создать тему'
        )
      }
    }
  }

  if (IS_STATIC_GH_PAGES_DEPLOY) {
    return (
      <div
        className={clsx(
          'landing',
          `landing--${theme}`,
          'AuthPage'
        )}>
        <Helmet>
          <meta charSet="utf-8" />
          <title>Форум Cosmic Match</title>
        </Helmet>
        <Header />
        <main className="auth-main">
          <div className="auth-card auth-card--wide">
            <Link to="/" className="forum-back">
              ← Назад
            </Link>
            <h1>Форум</h1>
            <StaticHostingForumNotice />
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div
      className={clsx(
        'landing',
        `landing--${theme}`,
        'AuthPage'
      )}>
      <Helmet>
        <meta charSet="utf-8" />
        <title>Форум Cosmic Match</title>
        <meta
          name="description"
          content="Форум игры Cosmic Match — обсуждения, идеи и баг-репорты."
        />
      </Helmet>

      <Header />

      <main className="auth-main">
        <div className="auth-card auth-card--wide">
          <Link to="/" className="forum-back">
            ← Назад
          </Link>

          <h1>Форум</h1>

          {actionError ? (
            <div className="auth-page__toast-wrap">
              <div className="auth-page__toast">
                {actionError}
              </div>
            </div>
          ) : null}

          <div className="forum-create-btn">
            <Button
              variant={
                showCreateForm
                  ? 'outline'
                  : 'primary'
              }
              onClick={() =>
                setShowCreateForm(v => !v)
              }>
              {showCreateForm
                ? 'Отмена'
                : '+ Новая тема'}
            </Button>
          </div>

          {showCreateForm && (
            <div className="extra-card extra-card--mb16">
              <div className="forum-form">
                <h3>Создать тему</h3>
                <div className="forum-form__field">
                  <label>Заголовок</label>
                  <Input
                    value={title}
                    onChange={e =>
                      setTitle(e.target.value)
                    }
                    placeholder="Название темы"
                  />
                </div>
                <div className="forum-form__field">
                  <label>Сообщение</label>
                  <TextArea
                    value={content}
                    onChange={e =>
                      setContent(e.target.value)
                    }
                    rows={4}
                    placeholder="Опишите вашу идею или вопрос"
                  />
                </div>
                <div className="forum-form__actions">
                  <Button
                    variant="primary"
                    onClick={handleCreateTopic}>
                    Опубликовать
                  </Button>
                </div>
              </div>
            </div>
          )}

          {isLoading ? (
            <p>Загрузка...</p>
          ) : topics.length === 0 ? (
            <div className="forum-empty">
              Тем пока нет. Создайте первую!
            </div>
          ) : (
            <>
              <div className="forum-list__header">
                <span>Форумы</span>
                <span>Комментарии</span>
                <span>Ответы</span>
              </div>
              <div className="forum-list">
                {topics.map(topic => (
                  <Link
                    to={`/forum/${topic.id}`}
                    key={topic.id}
                    className="forum-list__row">
                    <div>
                      <div className="forum-list__title">
                        <ForumPlainText
                          text={topic.title}
                          multiline={false}
                        />
                      </div>
                      <div className="forum-list__meta">
                        {topic.author} ·{' '}
                        {new Date(
                          topic.createdAt
                        ).toLocaleDateString(
                          'ru-RU'
                        )}
                      </div>
                    </div>
                    <span className="forum-list__count forum-list__count--accent">
                      {topic.commentsCount}
                    </span>
                    <span className="forum-list__count">
                      {topic.repliesCount}
                    </span>
                  </Link>
                ))}
              </div>
            </>
          )}
        </div>
      </main>

      <Footer />
    </div>
  )
}

export const initForumPage = async ({
  dispatch,
  state,
  getState,
}: PageInitArgs) => {
  if (isStaticGhPagesDeploy()) {
    return
  }

  if (
    !selectUser(state) &&
    !selectUserIsAuthChecked(state)
  ) {
    await dispatch(fetchUserThunk())
      .unwrap()
      .catch(() => undefined)
  }

  if (!selectUser(getState())) {
    return
  }

  try {
    await dispatch(fetchTopicsThunk()).unwrap()
  } catch {
    /* 403: редирект через slice + useEffect на странице */
  }
}
