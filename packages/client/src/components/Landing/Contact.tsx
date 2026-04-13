// Блок "Контакты" на лендинге с формой обратной связи
import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  useDispatch,
  useSelector,
} from '../../store'
import { selectUser } from '../../slices/userSlice'
import { createTopicThunk } from '../../slices/forumSlice'
import {
  Button,
  Input,
  TextArea,
} from '../../shared/ui'

export const Contact: React.FC = () => {
  const dispatch = useDispatch()
  const user = useSelector(selectUser)
  const isAuthorized = Boolean(user)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')

  const handleCreateTopic = () => {
    if (!title.trim() || !content.trim()) return
    dispatch(
      createTopicThunk({
        title: title.trim(),
        content: content.trim(),
        author: user?.first_name || 'Аноним',
      })
    )
    setTitle('')
    setContent('')
  }

  return (
    <section className="section" id="contact">
      <div className="contact__inner">
        {isAuthorized ? (
          <>
            <div id="forum" />
            <h2>Форум</h2>
            <p className="section-subtitle">
              Обсуждайте идеи, баги и стратегии с
              командой и игроками.
            </p>
            <p className="contact__forum-link">
              <Link
                to="/forum"
                className="btn btn--flat">
                Перейти в форум
              </Link>
            </p>
            <div className="contact-form">
              <h3>Создать новую тему</h3>
              <label>
                Заголовок
                <Input
                  value={title}
                  onChange={e =>
                    setTitle(e.target.value)
                  }
                  placeholder="Например: Идеи для новых бустеров"
                />
              </label>
              <label>
                Сообщение
                <TextArea
                  value={content}
                  onChange={e =>
                    setContent(e.target.value)
                  }
                  rows={4}
                  placeholder="Опишите идею, вопрос или проблему"
                />
              </label>
              <div className="contact-form__actions">
                <Button
                  type="button"
                  variant="primary"
                  onClick={handleCreateTopic}>
                  Опубликовать тему
                </Button>
              </div>
            </div>
          </>
        ) : (
          <>
            <h2>Обратная связь</h2>
            <p className="section-subtitle">
              Напишите, если хотите обсудить
              реализацию, механику уровней или
              совместную работу.
            </p>
            <form
              className="contact-form"
              id="contact-form">
              <div className="contact-form__row">
                <label>
                  Имя
                  <input
                    type="text"
                    id="cf-name"
                  />
                </label>
                <label>
                  Email
                  <input
                    type="email"
                    id="cf-email"
                  />
                </label>
              </div>
              <label>
                Тема
                <input
                  type="text"
                  id="cf-subject"
                  placeholder="Обратная связь по Cosmic Match"
                />
              </label>
              <label>
                Сообщение
                <textarea
                  id="cf-message"
                  rows={4}
                />
              </label>
              <div className="contact-form__actions">
                <button
                  type="submit"
                  className="btn btn--primary">
                  Отправить
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </section>
  )
}
