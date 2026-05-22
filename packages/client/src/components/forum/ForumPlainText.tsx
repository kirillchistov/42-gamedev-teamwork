import React from 'react'
import clsx from 'clsx'

type ForumPlainTextProps = {
  text: string
  className?: string
  /** Сохраняем переносы строк, введенные пользователем */
  multiline?: boolean
}

// Рендерит сохраненный ввод пользователя как React-детей (авто-экранированный) без парсинга
export const ForumPlainText: React.FC<
  ForumPlainTextProps
> = ({ text, className, multiline = true }) => (
  <span
    className={clsx(
      multiline && 'forum-plain-text--multiline',
      className
    )}>
    {text}
  </span>
)
