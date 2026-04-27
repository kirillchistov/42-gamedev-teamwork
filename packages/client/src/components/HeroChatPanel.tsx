import React, { useMemo, useState } from 'react'

type HeroChatMessage = {
  id: string
  author: string
  text: string
  createdAt: string
}

type HeroChatPanelProps = {
  title?: string
  messages: HeroChatMessage[]
  onSend: (text: string) => void
}

const EMOJIS = [
  '😀',
  '👍',
  '🔥',
  '🚀',
  '💡',
  '🤝',
]

export const HeroChatPanel: React.FC<
  HeroChatPanelProps
> = ({
  title = 'Чат героев',
  messages,
  onSend,
}) => {
  const [draft, setDraft] = useState('')
  const sorted = useMemo(
    () =>
      [...messages].sort((a, b) =>
        a.createdAt.localeCompare(b.createdAt)
      ),
    [messages]
  )

  const submit = () => {
    const text = draft.trim()
    if (!text) return
    onSend(text)
    setDraft('')
  }

  return (
    <section className="match3-hero-chat">
      <h3>{title}</h3>
      <div className="match3-hero-chat__list">
        {sorted.map(message => (
          <article
            key={message.id}
            className="match3-hero-chat__item">
            <header>
              <strong>{message.author}</strong>
              <span>
                {new Date(
                  message.createdAt
                ).toLocaleString('ru-RU', {
                  day: 'numeric',
                  month: 'short',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </header>
            <p>{message.text}</p>
          </article>
        ))}
      </div>
      <div className="match3-hero-chat__emoji">
        {EMOJIS.map(emoji => (
          <button
            key={emoji}
            type="button"
            className="match3-hero-chat__emoji-btn"
            onClick={() =>
              setDraft(prev => prev + emoji)
            }>
            {emoji}
          </button>
        ))}
      </div>
      <textarea
        value={draft}
        onChange={e => setDraft(e.target.value)}
        rows={3}
        placeholder="Сообщение в чат героев..."
      />
      <div className="match3-hero-chat__actions">
        <button
          type="button"
          className="btn btn--primary"
          onClick={submit}>
          Отправить
        </button>
      </div>
    </section>
  )
}
