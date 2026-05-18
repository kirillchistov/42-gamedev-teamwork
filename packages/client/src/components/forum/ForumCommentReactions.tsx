import React, {
  useEffect,
  useRef,
  useState,
} from 'react'
import clsx from 'clsx'

import { FORUM_REACTION_EMOJIS } from '../../constants/forumEmojis'
import type { ForumReactionAgg } from '../../types/forum'

const PICKER_TRIGGER_EMOJI = '🙂'

type ForumCommentReactionsProps = {
  rows: ForumReactionAgg[]
  onToggle: (emoji: string) => void
  children?: React.ReactNode
}

export const ForumCommentReactions: React.FC<
  ForumCommentReactionsProps
> = ({ rows, onToggle, children }) => {
  const [pickerOpen, setPickerOpen] =
    useState(false)
  const pickerRef = useRef<HTMLDivElement>(null)

  const placed = rows.filter(row => row.count > 0)

  useEffect(() => {
    if (!pickerOpen) {
      return
    }

    const onPointerDown = (event: MouseEvent) => {
      if (
        pickerRef.current &&
        !pickerRef.current.contains(
          event.target as Node
        )
      ) {
        setPickerOpen(false)
      }
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setPickerOpen(false)
      }
    }

    document.addEventListener(
      'mousedown',
      onPointerDown
    )
    document.addEventListener(
      'keydown',
      onKeyDown
    )
    return () => {
      document.removeEventListener(
        'mousedown',
        onPointerDown
      )
      document.removeEventListener(
        'keydown',
        onKeyDown
      )
    }
  }, [pickerOpen])

  const handlePick = (emoji: string) => {
    onToggle(emoji)
    setPickerOpen(false)
  }

  return (
    <>
      {placed.length > 0 ? (
        <div className="forum-reactions-placed">
          {placed.map(row => (
            <button
              key={row.emoji}
              type="button"
              className={clsx(
                'forum-reactions-placed__chip',
                row.mine &&
                  'forum-reactions-placed__chip--mine'
              )}
              title={
                row.mine
                  ? 'Снять реакцию'
                  : 'Поставить такую же'
              }
              onClick={() => onToggle(row.emoji)}>
              <span
                className="forum-reactions-placed__emoji"
                aria-hidden>
                {row.emoji}
              </span>
              <span className="forum-reactions-placed__count">
                {row.count}
              </span>
            </button>
          ))}
        </div>
      ) : null}

      <div className="forum-comment__toolbar">
        <div
          ref={pickerRef}
          className="forum-reaction-picker">
          <button
            type="button"
            className={clsx(
              'forum-reaction-picker__trigger',
              pickerOpen &&
                'forum-reaction-picker__trigger--open'
            )}
            aria-label="Добавить реакцию"
            aria-haspopup="listbox"
            aria-expanded={pickerOpen}
            onClick={() =>
              setPickerOpen(open => !open)
            }>
            <span
              className="forum-reaction-picker__trigger-icon"
              aria-hidden>
              {PICKER_TRIGGER_EMOJI}
            </span>
          </button>

          {pickerOpen ? (
            <div
              className="forum-reaction-picker__menu"
              role="listbox"
              aria-label="Выбор реакции">
              {FORUM_REACTION_EMOJIS.map(
                emoji => {
                  const row = rows.find(
                    r => r.emoji === emoji
                  )
                  const mine = row?.mine ?? false
                  const count = row?.count ?? 0
                  return (
                    <button
                      key={emoji}
                      type="button"
                      role="option"
                      aria-selected={mine}
                      className={clsx(
                        'forum-reaction-picker__option',
                        mine &&
                          'forum-reaction-picker__option--mine'
                      )}
                      title={
                        mine
                          ? 'Снять реакцию'
                          : 'Поставить реакцию'
                      }
                      onClick={() =>
                        handlePick(emoji)
                      }>
                      <span aria-hidden>
                        {emoji}
                      </span>
                      {count > 0 ? (
                        <span className="forum-reaction-picker__option-count">
                          {count}
                        </span>
                      ) : null}
                    </button>
                  )
                }
              )}
            </div>
          ) : null}
        </div>

        {children}
      </div>
    </>
  )
}
