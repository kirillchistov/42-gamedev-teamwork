import React, { useState } from 'react'
import { Helmet } from 'react-helmet'
import { Link } from 'react-router-dom'
import clsx from 'clsx'

import { Header } from '../components/Header'
import { Footer } from '../components/Footer'
import { useSelector, useDispatch } from '../store'
import { usePage } from '../hooks/usePage'
import { PageInitArgs } from '../routes'
import { Button, Input, TextArea } from '../shared/ui'
import {
  fetchTopicsThunk,
  createTopicThunk,
  selectTopics,
  selectIsLoadingForum,
} from '../slices/forumSlice'
import { selectUser } from '../slices/userSlice'

export const ForumPage: React.FC = () => {
  const dispatch = useDispatch()
  const topics = useSelector(selectTopics)
  const isLoading = useSelector(selectIsLoadingForum)
  const user = useSelector(selectUser)

  const [showCreateForm, setShowCreateForm] = useState(false)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')

  usePage({ initPage: initForumPage })

  const handleCreateTopic = () => {
    if (!title.trim() || !content.trim()) return

    dispatch(
      createTopicThunk({
        title: title.trim(),
        content: content.trim(),
        author: user?.name || 'Аноним',
      })
    )
    setTitle('')
    setContent('')
    setShowCreateForm(false)
  }

  return (
    <div className={clsx('landing', 'AuthPage')} id="landing-root">
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

          <div className="forum-create-btn">
            <Button
              variant={showCreateForm ? 'outline' : 'primary'}
              onClick={() => setShowCreateForm(v => !v)}>
              {showCreateForm ? 'Отмена' : '+ Новая тема'}
            </Button>
          </div>

          {showCreateForm && (
            <div className="extra-card" style={{ marginBottom: 16 }}>
              <div className="forum-form">
                <h3>Создать тему</h3>
                <div className="forum-form__field">
                  <label>Заголовок</label>
                  <Input
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    placeholder="Название темы"
                  />
                </div>
                <div className="forum-form__field">
                  <label>Сообщение</label>
                  <TextArea
                    value={content}
                    onChange={e => setContent(e.target.value)}
                    rows={4}
                    placeholder="Опишите вашу идею или вопрос"
                  />
                </div>
                <div className="forum-form__actions">
                  <Button variant="primary" onClick={handleCreateTopic}>
                    Опубликовать
                  </Button>
                </div>
              </div>
            </div>
          )}

          {isLoading ? (
            <p>Загрузка...</p>
          ) : topics.length === 0 ? (
            <div className="forum-empty">Тем пока нет. Создайте первую!</div>
          ) : (
            <>
              <div className="forum-list__header">
                <span>Форумы</span>
                <span>Темы</span>
                <span>Ответы</span>
              </div>
              <div className="forum-list">
                {topics.map(topic => (
                  <Link
                    to={`/forum/${topic.id}`}
                    key={topic.id}
                    className="forum-list__row">
                    <div>
                      <div className="forum-list__title">{topic.title}</div>
                      <div className="forum-list__meta">
                        {topic.author} ·{' '}
                        {new Date(topic.createdAt).toLocaleDateString('ru-RU')}
                      </div>
                    </div>
                    <span className="forum-list__count forum-list__count--accent">
                      1
                    </span>
                    <span className="forum-list__count">
                      {topic.commentsCount}
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

export const initForumPage = ({ dispatch }: PageInitArgs) => {
  return dispatch(fetchTopicsThunk())
}
