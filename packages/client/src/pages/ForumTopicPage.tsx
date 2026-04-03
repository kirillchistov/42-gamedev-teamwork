import React, { useEffect, useState } from 'react'
import { Helmet } from 'react-helmet'
import { Link, useParams } from 'react-router-dom'
import clsx from 'clsx'

import { Header } from '../components/Header'
import { Footer } from '../components/Footer'
import {
  useSelector,
  useDispatch,
} from '../store'
import { usePage } from '../hooks/usePage'
import { Button, TextArea } from '../shared/ui'
import {
  fetchTopicByIdThunk,
  createCommentThunk,
  selectCurrentTopic,
  selectComments,
  selectIsLoadingForum,
} from '../slices/forumSlice'
import { selectUser } from '../slices/userSlice'
import type { ForumComment } from '../types/forum'
import { useLandingTheme } from '../contexts/LandingThemeContext'

const EMOJIS = [
  '😀',
  '👍',
  '❤️',
  '🔥',
  '🎮',
  '⭐',
  '🚀',
  '💡',
  '🤔',
  '😎',
]

export const ForumTopicPage: React.FC = () => {
  const { theme } = useLandingTheme()
  const { topicId } = useParams<{
    topicId: string
  }>()
  const dispatch = useDispatch()
  const topic = useSelector(selectCurrentTopic)
  const comments = useSelector(selectComments)
  const isLoading = useSelector(
    selectIsLoadingForum
  )
  const user = useSelector(selectUser)

  const [newComment, setNewComment] = useState('')
  const [replyTo, setReplyTo] = useState<
    number | null
  >(null)

  usePage({ initPage: initForumTopicPage })

  useEffect(() => {
    if (topicId) {
      dispatch(
        fetchTopicByIdThunk(Number(topicId))
      )
    }
  }, [topicId, dispatch])

  const handleAddComment = () => {
    if (!newComment.trim() || !topicId) return

    dispatch(
      createCommentThunk({
        topicId: Number(topicId),
        content: newComment.trim(),
        author: user?.first_name || 'Аноним',
        parentCommentId: replyTo ?? undefined,
      })
    )
    setNewComment('')
    setReplyTo(null)
  }

  const handleEmojiClick = (emoji: string) => {
    setNewComment(prev => prev + emoji)
  }

  const renderComments = (
    allComments: ForumComment[],
    parentId: number | null = null,
    depth = 0
  ): React.ReactNode => {
    const filtered = allComments.filter(
      c => c.parentCommentId === parentId
    )
    if (filtered.length === 0) return null

    return filtered.map(comment => (
      <React.Fragment key={comment.id}>
        <div
          className={clsx('forum-comment', {
            'forum-comment--nested': depth > 0,
          })}>
          <div className="forum-comment__header">
            <span className="forum-comment__author">
              {comment.author}
            </span>
            <span className="forum-comment__date">
              {new Date(
                comment.createdAt
              ).toLocaleString('ru-RU', {
                day: 'numeric',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          </div>
          <div className="forum-comment__text">
            {comment.content}
          </div>
          <button
            type="button"
            className="forum-comment__reply-btn"
            onClick={() =>
              setReplyTo(comment.id)
            }>
            Ответить
          </button>
        </div>
        {renderComments(
          allComments,
          comment.id,
          depth + 1
        )}
      </React.Fragment>
    ))
  }

  const replyComment = replyTo
    ? comments.find(c => c.id === replyTo)
    : null

  return (
    <div
      className={clsx(
        'landing',
        `landing--${theme}`,
        'AuthPage'
      )}>
      <Helmet>
        <meta charSet="utf-8" />
        <title>
          {topic
            ? `${topic.title} — Форум`
            : 'Топик форума'}{' '}
          — Cosmic Match
        </title>
        <meta
          name="description"
          content="Обсуждение на форуме Cosmic Match"
        />
      </Helmet>

      <Header />

      <main className="auth-main">
        <div className="auth-card auth-card--wide">
          <Link
            to="/forum"
            className="forum-back">
            ← К форуму
          </Link>

          {isLoading && !topic ? (
            <p>Загрузка...</p>
          ) : !topic ? (
            <div className="forum-empty">
              Тема не найдена
            </div>
          ) : (
            <>
              <div className="forum-topic__header">
                <h1>{topic.title}</h1>
                <p className="forum-topic__meta">
                  {topic.author} ·{' '}
                  {new Date(
                    topic.createdAt
                  ).toLocaleDateString('ru-RU')}
                </p>
              </div>

              <div className="forum-topic__content">
                {topic.content}
              </div>

              <h2 className="forum-comments__title">
                Комментарии ({comments.length})
              </h2>

              <div className="forum-comments">
                {comments.length === 0 ? (
                  <div className="forum-empty">
                    Комментариев пока нет.
                    Напишите первый!
                  </div>
                ) : (
                  renderComments(comments)
                )}
              </div>

              <div className="extra-card">
                <div className="forum-form">
                  <h3>Добавить комментарий</h3>

                  {replyComment && (
                    <div className="forum-reply-indicator">
                      <span>
                        Ответ для{' '}
                        {replyComment.author}
                      </span>
                      <button
                        type="button"
                        className="forum-reply-indicator__cancel"
                        onClick={() =>
                          setReplyTo(null)
                        }>
                        ✕
                      </button>
                    </div>
                  )}

                  <div className="forum-emoji-bar">
                    {EMOJIS.map(emoji => (
                      <button
                        key={emoji}
                        type="button"
                        className="forum-emoji-bar__btn"
                        onClick={() =>
                          handleEmojiClick(emoji)
                        }>
                        {emoji}
                      </button>
                    ))}
                  </div>

                  <TextArea
                    value={newComment}
                    onChange={e =>
                      setNewComment(
                        e.target.value
                      )
                    }
                    rows={3}
                    placeholder="Ваш комментарий..."
                  />

                  <div className="forum-form__actions">
                    <Button
                      variant="primary"
                      onClick={handleAddComment}>
                      Отправить
                    </Button>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </main>

      <Footer />
    </div>
  )
}

export const initForumTopicPage = () =>
  Promise.resolve()
