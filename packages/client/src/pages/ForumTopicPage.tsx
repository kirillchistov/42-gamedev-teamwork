import React, { useEffect, useState } from 'react'
import { Helmet } from 'react-helmet'
import { Link, useNavigate, useParams } from 'react-router-dom'
import clsx from 'clsx'

import { Header } from '../components/Header'
import { Footer } from '../components/Footer'
import { useSelector, useDispatch } from '../store'
import { usePage } from '../hooks/usePage'
import { Button, Input, TextArea } from '../shared/ui'
import {
  fetchTopicByIdThunk,
  createCommentThunk,
  toggleCommentReactionThunk,
  updateTopicThunk,
  deleteTopicThunk,
  updateCommentThunk,
  deleteCommentThunk,
  selectCurrentTopic,
  selectComments,
  selectIsLoadingForum,
  selectForumShouldRedirectToLogin,
  selectForumReactionsByCommentId,
  clearForumAuthRedirect,
} from '../slices/forumSlice'
import type { ForumRejectPayload } from '../slices/forumSlice'
import { markForumAuthRedirect } from '../shared/forumAuthRedirect'
import type { ForumComment } from '../types/forum'
import { selectUser } from '../slices/userSlice'
import { useLandingTheme } from '../contexts/LandingThemeContext'
import { FORUM_REACTION_EMOJIS } from '../constants/forumEmojis'
import { ForumCommentReactions } from '../components/forum/ForumCommentReactions'
import { IS_STATIC_GH_PAGES_DEPLOY } from '../constants'
import { StaticHostingForumNotice } from '../components/StaticHostingNotice'
import {
  validateForumContent,
  validateForumTitle,
} from '../shared/security/plainTextContent'
import { ForumPlainText } from '../components/forum/ForumPlainText'

export function ForumTopicPage() {
  const { theme } = useLandingTheme()
  const { topicId } = useParams<{
    topicId: string
  }>()
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const topic = useSelector(selectCurrentTopic)
  const comments = useSelector(selectComments)
  const reactionsByCommentId = useSelector(selectForumReactionsByCommentId)
  const user = useSelector(selectUser)
  const isLoading = useSelector(selectIsLoadingForum)
  const shouldRedirectToLogin = useSelector(selectForumShouldRedirectToLogin)

  const [newComment, setNewComment] = useState('')
  const [replyTo, setReplyTo] = useState<number | null>(null)
  const [pageError, setPageError] = useState<string | null>(null)

  const [topicEditOpen, setTopicEditOpen] = useState(false)
  const [topicDraftTitle, setTopicDraftTitle] = useState('')
  const [topicDraftContent, setTopicDraftContent] = useState('')

  const [editingCommentId, setEditingCommentId] = useState<number | null>(null)
  const [commentDraft, setCommentDraft] = useState('')

  usePage({ initPage: initForumTopicPage })

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

  useEffect(() => {
    if (IS_STATIC_GH_PAGES_DEPLOY || !topicId) {
      return
    }
    void (async () => {
      try {
        await dispatch(fetchTopicByIdThunk(Number(topicId))).unwrap()
      } catch {
        /* 403 — редирект; 404 — пустой топик в state */
      }
    })()
  }, [topicId, dispatch])

  const isTopicAuthor =
    user != null && topic != null && user.id === topic.authorPraktikumId

  const viewerIsModerator = Boolean(topic?.viewerIsModerator)
  const canEditTopic = isTopicAuthor || viewerIsModerator

  const handleAddComment = async () => {
    if (!topicId) return
    setPageError(null)
    const contentCheck = validateForumContent(newComment)
    if (!contentCheck.ok) {
      setPageError(contentCheck.reason)
      return
    }
    try {
      await dispatch(
        createCommentThunk({
          topicId: Number(topicId),
          content: contentCheck.value,
          parentCommentId: replyTo ?? undefined,
        })
      ).unwrap()
      setNewComment('')
      setReplyTo(null)
    } catch (e) {
      const p = e as ForumRejectPayload
      if (p?.status !== 403) {
        setPageError(p?.message || 'Не удалось отправить комментарий')
      }
    }
  }

  const handleEmojiClick = (emoji: string) => {
    setNewComment(prev => prev + emoji)
  }

  const handleToggleReaction = async (commentId: number, emoji: string) => {
    if (!topicId) return
    setPageError(null)
    try {
      await dispatch(
        toggleCommentReactionThunk({
          topicId: Number(topicId),
          commentId,
          emoji,
        })
      ).unwrap()
    } catch (e) {
      const p = e as ForumRejectPayload
      if (p?.status !== 403) {
        setPageError(p?.message || 'Не удалось изменить реакцию')
      }
    }
  }

  const handleOpenTopicEdit = () => {
    if (!topic) return
    setTopicDraftTitle(topic.title)
    setTopicDraftContent(topic.content)
    setTopicEditOpen(true)
  }

  const handleSaveTopic = async () => {
    if (!topicId) return
    setPageError(null)
    const titleCheck = validateForumTitle(topicDraftTitle)
    if (!titleCheck.ok) {
      setPageError(titleCheck.reason)
      return
    }
    const contentCheck = validateForumContent(topicDraftContent)
    if (!contentCheck.ok) {
      setPageError(contentCheck.reason)
      return
    }
    try {
      await dispatch(
        updateTopicThunk({
          topicId: Number(topicId),
          title: titleCheck.value,
          content: contentCheck.value,
        })
      ).unwrap()
      setTopicEditOpen(false)
    } catch (e) {
      const p = e as ForumRejectPayload
      if (p?.status !== 403) {
        setPageError(p?.message || 'Не удалось сохранить тему')
      }
    }
  }

  const handleDeleteTopic = async () => {
    if (!topicId) return
    if (!window.confirm('Удалить тему и все комментарии?')) {
      return
    }
    setPageError(null)
    try {
      await dispatch(deleteTopicThunk(Number(topicId))).unwrap()
      navigate('/forum')
    } catch (e) {
      const p = e as ForumRejectPayload
      if (p?.status !== 403) {
        setPageError(p?.message || 'Не удалось удалить тему')
      }
    }
  }

  const handleSaveComment = async (commentId: number) => {
    setPageError(null)
    const contentCheck = validateForumContent(commentDraft)
    if (!contentCheck.ok) {
      setPageError(contentCheck.reason)
      return
    }
    try {
      await dispatch(
        updateCommentThunk({
          commentId,
          content: contentCheck.value,
        })
      ).unwrap()
      setEditingCommentId(null)
      setCommentDraft('')
    } catch (e) {
      const p = e as ForumRejectPayload
      if (p?.status !== 403) {
        setPageError(p?.message || 'Не удалось сохранить комментарий')
      }
    }
  }

  const handleDeleteComment = async (commentId: number) => {
    if (!topicId) return
    if (!window.confirm('Удалить комментарий?')) {
      return
    }
    setPageError(null)
    try {
      await dispatch(
        deleteCommentThunk({
          topicId: Number(topicId),
          commentId,
        })
      ).unwrap()
      if (replyTo === commentId) {
        setReplyTo(null)
      }
      if (editingCommentId === commentId) {
        setEditingCommentId(null)
      }
    } catch (e) {
      const p = e as ForumRejectPayload
      if (p?.status !== 403) {
        setPageError(p?.message || 'Не удалось удалить комментарий')
      }
    }
  }

  const renderComments = (
    allComments: ForumComment[],
    parentId: number | null = null,
    depth = 0
  ): React.ReactNode => {
    const filtered = allComments.filter(c => c.parentCommentId === parentId)
    if (filtered.length === 0) return null

    return filtered.map(comment => {
      const rows = reactionsByCommentId[comment.id] ?? []
      const isCommentAuthor =
        user != null && user.id === comment.authorPraktikumId
      const canEditComment = isCommentAuthor || viewerIsModerator

      return (
        <React.Fragment key={comment.id}>
          <div
            className={clsx('forum-comment', {
              'forum-comment--nested': depth > 0,
            })}>
            <div className="forum-comment__header">
              <span className="forum-comment__author">{comment.author}</span>
              <span className="forum-comment__date">
                {new Date(comment.createdAt).toLocaleString('ru-RU', {
                  day: 'numeric',
                  month: 'short',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>
            {editingCommentId === comment.id ? (
              <div className="forum-comment__edit">
                <TextArea
                  value={commentDraft}
                  onChange={e => setCommentDraft(e.target.value)}
                  rows={3}
                />
                <div className="forum-form__actions">
                  <Button
                    variant="primary"
                    onClick={() => void handleSaveComment(comment.id)}>
                    Сохранить
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setEditingCommentId(null)
                      setCommentDraft('')
                    }}>
                    Отмена
                  </Button>
                </div>
              </div>
            ) : (
              <div className="forum-comment__text">
                <ForumPlainText text={comment.content} />
              </div>
            )}

            <ForumCommentReactions
              rows={rows}
              onToggle={emoji => void handleToggleReaction(comment.id, emoji)}>
              <button
                type="button"
                className="forum-comment__reply-btn"
                onClick={() => setReplyTo(comment.id)}>
                Ответить
              </button>
              {canEditComment && editingCommentId !== comment.id && (
                <>
                  <button
                    type="button"
                    className="forum-comment__reply-btn"
                    onClick={() => {
                      setEditingCommentId(comment.id)
                      setCommentDraft(comment.content)
                    }}>
                    Изменить
                  </button>
                  <button
                    type="button"
                    className="forum-comment__reply-btn"
                    onClick={() => void handleDeleteComment(comment.id)}>
                    Удалить
                  </button>
                </>
              )}
            </ForumCommentReactions>
          </div>
          {renderComments(allComments, comment.id, depth + 1)}
        </React.Fragment>
      )
    })
  }

  const replyComment = replyTo ? comments.find(c => c.id === replyTo) : null

  if (IS_STATIC_GH_PAGES_DEPLOY) {
    return (
      <div className={clsx('landing', `landing--${theme}`, 'AuthPage')}>
        <Helmet>
          <meta charSet="utf-8" />
          <title>Топик форума — Cosmic Match</title>
        </Helmet>
        <Header />
        <main className="auth-main">
          <div className="auth-card auth-card--wide">
            <Link to="/forum" className="forum-back">
              ← К списку тем
            </Link>
            <StaticHostingForumNotice />
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className={clsx('landing', `landing--${theme}`, 'AuthPage')}>
      <Helmet>
        <meta charSet="utf-8" />
        <title>
          {topic ? `${topic.title} — Форум` : 'Топик форума'} — Cosmic Match
        </title>
        <meta name="description" content="Обсуждение на форуме Cosmic Match" />
      </Helmet>

      <Header />

      <main className="auth-main">
        <div className="auth-card auth-card--wide">
          <Link to="/forum" className="forum-back">
            ← К форуму
          </Link>

          {pageError ? (
            <div className="auth-page__toast-wrap">
              <div className="auth-page__toast">{pageError}</div>
            </div>
          ) : null}

          {isLoading && !topic ? (
            <p>Загрузка...</p>
          ) : !topic ? (
            <div className="forum-empty">Тема не найдена</div>
          ) : (
            <>
              <div className="forum-topic__header">
                <h1>
                  <ForumPlainText text={topic.title} multiline={false} />
                </h1>
                <p className="forum-topic__meta">
                  {topic.author} ·{' '}
                  {new Date(topic.createdAt).toLocaleDateString('ru-RU')}
                </p>
                {canEditTopic ? (
                  <div className="forum-form__actions forum-topic__actions">
                    {!topicEditOpen ? (
                      <>
                        <Button variant="outline" onClick={handleOpenTopicEdit}>
                          Редактировать тему
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => void handleDeleteTopic()}>
                          Удалить тему
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button
                          variant="primary"
                          onClick={() => void handleSaveTopic()}>
                          Сохранить
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => setTopicEditOpen(false)}>
                          Отмена
                        </Button>
                      </>
                    )}
                  </div>
                ) : null}
              </div>

              {topicEditOpen ? (
                <div className="extra-card extra-card--mb16">
                  <div className="forum-form__field">
                    <label>Заголовок</label>
                    <Input
                      value={topicDraftTitle}
                      onChange={e => setTopicDraftTitle(e.target.value)}
                    />
                  </div>
                  <div className="forum-form__field">
                    <label>Текст</label>
                    <TextArea
                      value={topicDraftContent}
                      onChange={e => setTopicDraftContent(e.target.value)}
                      rows={6}
                    />
                  </div>
                </div>
              ) : (
                <div className="forum-topic__content">
                  <ForumPlainText text={topic.content} />
                </div>
              )}

              <h2 className="forum-comments__title">
                Комментарии ({comments.length})
              </h2>

              <div className="forum-comments">
                {comments.length === 0 ? (
                  <div className="forum-empty">
                    Комментариев пока нет. Напишите первый!
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
                      <span>Ответ для {replyComment.author}</span>
                      <button
                        type="button"
                        className="forum-reply-indicator__cancel"
                        onClick={() => setReplyTo(null)}>
                        ✕
                      </button>
                    </div>
                  )}

                  <div className="forum-emoji-bar">
                    {FORUM_REACTION_EMOJIS.map(emoji => (
                      <button
                        key={emoji}
                        type="button"
                        className="forum-emoji-bar__btn"
                        onClick={() => handleEmojiClick(emoji)}>
                        {emoji}
                      </button>
                    ))}
                  </div>

                  <TextArea
                    value={newComment}
                    onChange={e => setNewComment(e.target.value)}
                    rows={3}
                    placeholder="Ваш комментарий..."
                  />

                  <div className="forum-form__actions">
                    <Button
                      variant="primary"
                      onClick={() => void handleAddComment()}>
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

export const initForumTopicPage = () => Promise.resolve()
